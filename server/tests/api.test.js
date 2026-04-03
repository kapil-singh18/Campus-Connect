import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "node:path";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_EXPIRES_IN = "1d";
process.env.GEMINI_API_KEY = "";
process.env.WIT_API_TOKEN = "";

const { default: app } = await import("../src/app.js");
const { connectDB, disconnectDB } = await import("../src/config/db.js");
const { User } = await import("../src/models/User.js");
const { Club } = await import("../src/models/Club.js");
const { Event } = await import("../src/models/Event.js");
const { Registration } = await import("../src/models/Registration.js");
const { createToken } = await import("../src/utils/auth.js");

let mongoServer;
const mongoBinaryDir = path.resolve(".mongodb-binaries");

const createUser = async ({ role = "student", email }) => {
  const passwordHash = await bcrypt.hash("Campus@123", 10);
  return User.create({
    name: `${role}-user`,
    email,
    passwordHash,
    role,
  });
};

describe("Campus Connect API", () => {
  const eventDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const registrationDeadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        downloadDir: mongoBinaryDir,
      },
    });
    await connectDB(mongoServer.getUri());
  }, 240000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      Registration.deleteMany({}),
      Event.deleteMany({}),
      Club.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  it("supports signup, login, and /me", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send({
      name: "Test Student",
      email: "student@test.local",
      password: "Campus@123",
      role: "student",
    });

    expect(signupRes.status).toBe(201);
    expect(signupRes.body.token).toBeTypeOf("string");

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "student@test.local",
      password: "Campus@123",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe("student");

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe("student@test.local");
  });

  it("updates profile name and email with current password", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send({
      name: "Profile Student",
      email: "profile@test.local",
      password: "Campus@123",
      role: "student",
    });

    const token = signupRes.body.token;
    const updateRes = await request(app)
      .patch("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Student",
        email: "profile.updated@test.local",
        currentPassword: "Campus@123",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user.name).toBe("Updated Student");
    expect(updateRes.body.user.email).toBe("profile.updated@test.local");
  });

  it("prevents manager from creating events for another manager's club", async () => {
    const managerOne = await createUser({ role: "manager", email: "m1@test.local" });
    const managerTwo = await createUser({ role: "manager", email: "m2@test.local" });

    const otherClub = await Club.create({
      name: "Other Club",
      description: "desc",
      category: "Tech",
      manager: managerTwo._id,
      members: [],
    });

    const token = createToken(managerOne._id.toString());

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        club: otherClub._id.toString(),
        title: "Unauthorized Event",
        description: "Should fail",
        category: "Tech",
        date: eventDate.toISOString(),
        venue: "Hall A",
        maxParticipants: 50,
        registrationDeadline: registrationDeadline.toISOString(),
        posterUrl: "https://example.com/poster.png",
      });

    expect(res.status).toBe(403);
  });

  it("handles register/unregister flows for students", async () => {
    const manager = await createUser({ role: "manager", email: "manager@test.local" });
    const student = await createUser({ role: "student", email: "student@test.local" });

    const club = await Club.create({
      name: "Tech Club",
      description: "desc",
      category: "Technology",
      manager: manager._id,
      members: [student._id],
    });

    await User.findByIdAndUpdate(student._id, {
      $addToSet: { joinedClubs: club._id },
    });

    const event = await Event.create({
      club: club._id,
      title: "Tech Meetup",
      description: "desc",
      category: "Technology",
      date: eventDate,
      venue: "Lab 1",
      maxParticipants: 50,
      registrationDeadline,
      posterUrl: "https://example.com/poster.png",
      createdBy: manager._id,
    });

    const token = createToken(student._id.toString());

    const registerRes = await request(app)
      .post(`/api/events/${event._id}/register`)
      .set("Authorization", `Bearer ${token}`);
    expect(registerRes.status).toBe(201);

    const duplicateRes = await request(app)
      .post(`/api/events/${event._id}/register`)
      .set("Authorization", `Bearer ${token}`);
    expect(duplicateRes.status).toBe(409);

    const unregisterRes = await request(app)
      .delete(`/api/events/${event._id}/register`)
      .set("Authorization", `Bearer ${token}`);
    expect(unregisterRes.status).toBe(200);
  });

  it("prevents event registration if student has not joined the club", async () => {
    const manager = await createUser({ role: "manager", email: "clubmanager@test.local" });
    const student = await createUser({ role: "student", email: "clubstudent@test.local" });

    const club = await Club.create({
      name: "Membership Club",
      description: "desc",
      category: "Technology",
      manager: manager._id,
      members: [],
    });

    const event = await Event.create({
      club: club._id,
      title: "Members Only Event",
      description: "desc",
      category: "Technology",
      date: eventDate,
      venue: "Lab 3",
      maxParticipants: 25,
      registrationDeadline,
      posterUrl: "https://example.com/poster.png",
      createdBy: manager._id,
    });

    const token = createToken(student._id.toString());
    const res = await request(app)
      .post(`/api/events/${event._id}/register`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/join this club first/i);
  });

  it("returns chatbot fallback when Gemini key is missing", async () => {
    const student = await createUser({ role: "student", email: "ask@test.local" });
    const token = createToken(student._id.toString());

    const res = await request(app)
      .post("/api/chatbot/ask")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Which event should I attend?" });

    expect(res.status).toBe(200);
    expect(res.body.provider).toBe("fallback");
    expect(res.body.reply).toBeTypeOf("string");
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBe(3);
  });

  it("allows only the assigned manager to delete an event", async () => {
    const ownerManager = await createUser({ role: "manager", email: "owner@test.local" });
    const otherManager = await createUser({ role: "manager", email: "other@test.local" });
    const admin = await createUser({ role: "admin", email: "admin@test.local" });

    const club = await Club.create({
      name: "Delete Event Club",
      description: "desc",
      category: "Technology",
      manager: ownerManager._id,
      members: [],
    });

    const event = await Event.create({
      club: club._id,
      title: "Delete Event Test",
      description: "desc",
      category: "Technology",
      date: eventDate,
      venue: "Hall 1",
      maxParticipants: 30,
      registrationDeadline,
      posterUrl: "https://example.com/poster.png",
      createdBy: ownerManager._id,
    });

    const otherManagerToken = createToken(otherManager._id.toString());
    const adminToken = createToken(admin._id.toString());
    const ownerToken = createToken(ownerManager._id.toString());

    const forbiddenForOtherManager = await request(app)
      .delete(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${otherManagerToken}`);
    expect(forbiddenForOtherManager.status).toBe(403);

    const forbiddenForAdmin = await request(app)
      .delete(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(forbiddenForAdmin.status).toBe(403);

    const successForOwner = await request(app)
      .delete(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(successForOwner.status).toBe(200);
  });

  it("allows only the assigned manager to delete a club", async () => {
    const ownerManager = await createUser({ role: "manager", email: "clubowner@test.local" });
    const otherManager = await createUser({ role: "manager", email: "clubother@test.local" });
    const admin = await createUser({ role: "admin", email: "clubadmin@test.local" });

    const club = await Club.create({
      name: "Delete Club Test",
      description: "desc",
      category: "Social",
      manager: ownerManager._id,
      members: [],
    });

    const otherManagerToken = createToken(otherManager._id.toString());
    const adminToken = createToken(admin._id.toString());
    const ownerToken = createToken(ownerManager._id.toString());

    const forbiddenForOtherManager = await request(app)
      .delete(`/api/clubs/${club._id}`)
      .set("Authorization", `Bearer ${otherManagerToken}`);
    expect(forbiddenForOtherManager.status).toBe(403);

    const forbiddenForAdmin = await request(app)
      .delete(`/api/clubs/${club._id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(forbiddenForAdmin.status).toBe(403);

    const successForOwner = await request(app)
      .delete(`/api/clubs/${club._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(successForOwner.status).toBe(200);
  });

  it("blocks student registration when manager closes registration", async () => {
    const manager = await createUser({ role: "manager", email: "togglemanager@test.local" });
    const student = await createUser({ role: "student", email: "togglestudent@test.local" });

    const club = await Club.create({
      name: "Toggle Club",
      description: "desc",
      category: "Tech",
      manager: manager._id,
      members: [student._id],
    });

    await User.findByIdAndUpdate(student._id, {
      $addToSet: { joinedClubs: club._id },
    });

    const event = await Event.create({
      club: club._id,
      title: "Toggle Event",
      description: "desc",
      category: "Tech",
      date: eventDate,
      venue: "Hall 2",
      maxParticipants: 10,
      registrationDeadline,
      posterUrl: "https://example.com/poster.png",
      createdBy: manager._id,
    });

    const managerToken = createToken(manager._id.toString());
    const studentToken = createToken(student._id.toString());

    const closeRes = await request(app)
      .patch(`/api/events/${event._id}/registration-status`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ closed: true });
    expect(closeRes.status).toBe(200);

    const registerRes = await request(app)
      .post(`/api/events/${event._id}/register`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(registerRes.status).toBe(409);
  });

  it("prevents club deletion when upcoming events exist", async () => {
    const manager = await createUser({ role: "manager", email: "guardmanager@test.local" });
    const club = await Club.create({
      name: "Guard Club",
      description: "desc",
      category: "Tech",
      manager: manager._id,
      members: [],
    });

    await Event.create({
      club: club._id,
      title: "Upcoming Guard Event",
      description: "desc",
      category: "Tech",
      date: eventDate,
      venue: "Hall 4",
      maxParticipants: 40,
      registrationDeadline,
      posterUrl: "https://example.com/poster.png",
      createdBy: manager._id,
    });

    const managerToken = createToken(manager._id.toString());
    const res = await request(app)
      .delete(`/api/clubs/${club._id}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(409);
  });
});
