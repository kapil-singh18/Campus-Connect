import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Notification } from "../models/Notification.js";
import { ActivityLog } from "../models/ActivityLog.js";

const buildDateAt = (offsetDays, hour = 12) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
};

const buildRegistrationDeadline = (eventDate, daysBefore = 1) => {
  const date = new Date(eventDate);
  date.setDate(date.getDate() - daysBefore);
  return date;
};

const runSeed = async () => {
  await connectDB();

  await Promise.all([
    ActivityLog.deleteMany({}),
    Notification.deleteMany({}),
    Registration.deleteMany({}),
    Event.deleteMany({}),
    Club.deleteMany({}),
    User.deleteMany({}),
  ]);

  const password = "Campus@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const [admin, managerA, managerB, managerC, studentA, studentB, studentC, studentD] =
    await User.create([
      {
        name: "Campus Admin",
        email: "admin@campusconnect.test",
        passwordHash,
        role: "admin",
      },
      {
        name: "Riya Manager",
        email: "manager1@campusconnect.test",
        passwordHash,
        role: "manager",
      },
      {
        name: "Arjun Manager",
        email: "manager2@campusconnect.test",
        passwordHash,
        role: "manager",
      },
      {
        name: "Sara Manager",
        email: "manager3@campusconnect.test",
        passwordHash,
        role: "manager",
      },
      {
        name: "Neha Student",
        email: "student1@campusconnect.test",
        passwordHash,
        role: "student",
      },
      {
        name: "Kabir Student",
        email: "student2@campusconnect.test",
        passwordHash,
        role: "student",
      },
      {
        name: "Aditi Student",
        email: "student3@campusconnect.test",
        passwordHash,
        role: "student",
      },
      {
        name: "Rahul Student",
        email: "student4@campusconnect.test",
        passwordHash,
        role: "student",
      },
    ]);

  const clubs = await Club.create([
    {
      name: "CodeCraft Club",
      description: "Collaborative coding, hackathons, and peer-led tech workshops.",
      category: "Technology",
      manager: managerA._id,
      members: [studentA._id, studentC._id],
    },
    {
      name: "RoboSphere Society",
      description: "Hands-on robotics projects, electronics sessions, and demos.",
      category: "Engineering",
      manager: managerB._id,
      members: [studentB._id, studentD._id],
    },
    {
      name: "Campus Culture Collective",
      description: "Dance, drama, and cultural performances for annual events.",
      category: "Cultural",
      manager: managerB._id,
      members: [studentA._id, studentB._id, studentD._id],
    },
    {
      name: "Green Earth Forum",
      description: "Sustainability drives, campus cleanups, and awareness campaigns.",
      category: "Social",
      manager: managerA._id,
      members: [studentC._id],
    },
    {
      name: "BizNext Circle",
      description: "Startup meetups, product pitch sessions, and business simulations.",
      category: "Entrepreneurship",
      manager: managerC._id,
      members: [studentA._id, studentB._id, studentC._id],
    },
    {
      name: "FitMind Sports Club",
      description: "Fitness routines, sports meetups, and mindful movement sessions.",
      category: "Sports",
      manager: managerC._id,
      members: [studentD._id],
    },
  ]);

  await Promise.all([
    User.updateOne(
      { _id: studentA._id },
      { $set: { joinedClubs: [clubs[0]._id, clubs[2]._id, clubs[4]._id] } }
    ),
    User.updateOne(
      { _id: studentB._id },
      { $set: { joinedClubs: [clubs[1]._id, clubs[2]._id, clubs[4]._id] } }
    ),
    User.updateOne(
      { _id: studentC._id },
      { $set: { joinedClubs: [clubs[0]._id, clubs[3]._id, clubs[4]._id] } }
    ),
    User.updateOne({ _id: studentD._id }, { $set: { joinedClubs: [clubs[1]._id, clubs[2]._id, clubs[5]._id] } }),
  ]);

  const events = await Event.create([
    {
      club: clubs[0]._id,
      title: "Campus Hack Sprint",
      description:
        "A fast-paced coding challenge where teams build practical student tools in one day.",
      category: "Technology",
      date: buildDateAt(6, 10),
      venue: "Innovation Lab, Block B",
      maxParticipants: 160,
      registrationDeadline: buildRegistrationDeadline(buildDateAt(6, 10), 1),
      posterUrl:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
      createdBy: managerA._id,
    },
    {
      club: clubs[0]._id,
      title: "Intro to Web APIs",
      description: "Hands-on workshop for building REST APIs with practical campus examples.",
      category: "Technology",
      date: buildDateAt(2, 14),
      venue: "Tech Seminar Hall",
      maxParticipants: 80,
      registrationDeadline: buildRegistrationDeadline(buildDateAt(2, 14), 1),
      posterUrl:
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
      createdBy: managerA._id,
    },
    {
      club: clubs[2]._id,
      title: "Open Mic Evening",
      description: "An ongoing celebration of music, poetry, and storytelling from students.",
      category: "Cultural",
      date: buildDateAt(0, 18),
      venue: "Main Auditorium",
      maxParticipants: 140,
      registrationDeadline: buildRegistrationDeadline(buildDateAt(0, 18), 0),
      posterUrl:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
      createdBy: managerB._id,
    },
    {
      club: clubs[1]._id,
      title: "Robo Basics Workshop",
      description: "Completed introductory workshop on sensors, motors, and robot build basics.",
      category: "Engineering",
      date: buildDateAt(-5, 11),
      venue: "Mechanical Lab 2",
      maxParticipants: 60,
      registrationDeadline: buildRegistrationDeadline(buildDateAt(-5, 11), 1),
      posterUrl:
        "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80",
      createdBy: managerB._id,
    },
    {
      club: clubs[3]._id,
      title: "Campus Clean Drive",
      description: "Volunteer cleanup campaign with reusable kit distribution.",
      category: "Social",
      date: buildDateAt(4, 8),
      venue: "College Main Gate",
      maxParticipants: 120,
      registrationDeadline: buildRegistrationDeadline(buildDateAt(4, 8), 1),
      posterUrl:
        "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80",
      createdBy: managerA._id,
    },
    {
      club: clubs[4]._id,
      title: "Startup Pitch Clinic",
      description: "Pitch your startup idea and get live feedback from alumni founders.",
      category: "Entrepreneurship",
      date: buildDateAt(10, 16),
      venue: "Business Incubation Hub",
      maxParticipants: 90,
      registrationDeadline: buildRegistrationDeadline(buildDateAt(10, 16), 2),
      posterUrl:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
      createdBy: managerC._id,
    },
    {
      club: clubs[4]._id,
      title: "Resume and LinkedIn Lab",
      description: "Career branding session for internships and placements.",
      category: "Career",
      date: buildDateAt(-2, 15),
      venue: "Placement Cell Room",
      maxParticipants: 70,
      registrationDeadline: buildRegistrationDeadline(buildDateAt(-2, 15), 1),
      posterUrl:
        "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
      createdBy: managerC._id,
    },
    {
      club: clubs[5]._id,
      title: "Morning Fitness Jam",
      description: "A guided fitness and mobility session for all students.",
      category: "Sports",
      date: buildDateAt(1, 7),
      venue: "Sports Ground",
      maxParticipants: 110,
      registrationDeadline: buildRegistrationDeadline(buildDateAt(1, 7), 0),
      posterUrl:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
      createdBy: managerC._id,
    },
    {
      club: clubs[2]._id,
      title: "Street Play for Awareness",
      description: "Team-based stage street play about digital safety.",
      category: "Cultural",
      date: buildDateAt(-8, 17),
      venue: "Open Stage Courtyard",
      maxParticipants: 75,
      registrationDeadline: buildRegistrationDeadline(buildDateAt(-8, 17), 1),
      posterUrl:
        "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80",
      createdBy: managerB._id,
    },
  ]);

  await Registration.create([
    {
      user: studentA._id,
      event: events[0]._id,
      club: events[0].club,
      name: studentA.name,
      email: studentA.email,
      phone: "9876541001",
      department: "Computer Science",
      year: "3rd Year",
    },
    {
      user: studentA._id,
      event: events[2]._id,
      club: events[2].club,
      name: studentA.name,
      email: studentA.email,
      phone: "9876541001",
      department: "Computer Science",
      year: "3rd Year",
    },
    {
      user: studentA._id,
      event: events[5]._id,
      club: events[5].club,
      name: studentA.name,
      email: studentA.email,
      phone: "9876541001",
      department: "Computer Science",
      year: "3rd Year",
    },
    {
      user: studentB._id,
      event: events[2]._id,
      club: events[2].club,
      name: studentB.name,
      email: studentB.email,
      phone: "9876541002",
      department: "Mechanical",
      year: "2nd Year",
    },
    {
      user: studentB._id,
      event: events[4]._id,
      club: events[4].club,
      name: studentB.name,
      email: studentB.email,
      phone: "9876541002",
      department: "Mechanical",
      year: "2nd Year",
    },
    {
      user: studentC._id,
      event: events[1]._id,
      club: events[1].club,
      name: studentC.name,
      email: studentC.email,
      phone: "9876541003",
      department: "Electronics",
      year: "1st Year",
    },
    {
      user: studentC._id,
      event: events[7]._id,
      club: events[7].club,
      name: studentC.name,
      email: studentC.email,
      phone: "9876541003",
      department: "Electronics",
      year: "1st Year",
    },
    {
      user: studentD._id,
      event: events[3]._id,
      club: events[3].club,
      name: studentD.name,
      email: studentD.email,
      phone: "9876541004",
      department: "Civil",
      year: "4th Year",
    },
    {
      user: studentD._id,
      event: events[8]._id,
      club: events[8].club,
      name: studentD.name,
      email: studentD.email,
      phone: "9876541004",
      department: "Civil",
      year: "4th Year",
    },
  ]);

  console.log("Seed complete.");
  console.log("Demo credentials (password for all): Campus@123");
  console.log("admin@campusconnect.test (admin)");
  console.log("manager1@campusconnect.test (manager)");
  console.log("manager2@campusconnect.test (manager)");
  console.log("manager3@campusconnect.test (manager)");
  console.log("student1@campusconnect.test (student)");
  console.log("student2@campusconnect.test (student)");
  console.log("student3@campusconnect.test (student)");
  console.log("student4@campusconnect.test (student)");
  console.log(`Seeded clubs: ${clubs.length}, events: ${events.length}, registrations: 9`);

  await disconnectDB();
};

runSeed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await disconnectDB();
  process.exit(1);
});
