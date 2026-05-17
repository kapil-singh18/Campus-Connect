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

const studentProfiles = [
  ["Neha Iyer", "Computer Science", "3rd Year"],
  ["Kabir Khan", "Mechanical", "2nd Year"],
  ["Aditi Rao", "Electronics", "1st Year"],
  ["Rahul Verma", "Civil", "4th Year"],
  ["Priya Sharma", "Information Technology", "2nd Year"],
  ["Rohan Mehta", "Computer Science", "3rd Year"],
  ["Meera Nair", "Business Administration", "2nd Year"],
  ["Vikram Singh", "Mechanical", "3rd Year"],
  ["Ananya Patel", "Computer Science", "1st Year"],
  ["Kunal Rao", "Law", "3rd Year"],
  ["Tara Mehta", "Computer Applications", "2nd Year"],
  ["Ishaan Gupta", "Electronics", "4th Year"],
  ["Sana Ali", "Design", "1st Year"],
  ["Dev Menon", "Data Science", "2nd Year"],
  ["Nisha Kapoor", "Commerce", "3rd Year"],
  ["Harsh Jain", "Electrical", "4th Year"],
  ["Lavanya Das", "Mass Communication", "2nd Year"],
  ["Omar Farooq", "Computer Science", "1st Year"],
  ["Maya Thomas", "Biotechnology", "3rd Year"],
  ["Arnav Shah", "Business Administration", "4th Year"],
];

const managerNames = [
  "Riya Manager",
  "Arjun Manager",
  "Sara Manager",
  "Devika Manager",
  "Manav Manager",
  "Tanya Manager",
  "Kabir Manager",
  "Asha Manager",
  "Nikhil Manager",
  "Ira Manager",
  "Varun Manager",
  "Mira Manager",
  "Karan Manager",
  "Pooja Manager",
  "Aarav Manager",
  "Simran Manager",
  "Yusuf Manager",
  "Leena Manager",
  "Raghav Manager",
  "Diya Manager",
];

const clubTemplates = [
  ["CodeCraft Club", "Collaborative coding, hackathons, and peer-led tech workshops.", "Technology"],
  ["RoboSphere Society", "Hands-on robotics projects, electronics sessions, and demos.", "Engineering"],
  ["Campus Culture Collective", "Dance, drama, and cultural performances for annual events.", "Cultural"],
  ["Green Earth Forum", "Sustainability drives, campus cleanups, and awareness campaigns.", "Social"],
  ["BizNext Circle", "Startup meetups, product pitch sessions, and business simulations.", "Entrepreneurship"],
  ["FitMind Sports Club", "Fitness routines, sports meetups, and mindful movement sessions.", "Sports"],
  ["PixelLens Studio", "Photography walks, editing clinics, and visual storytelling projects.", "Media"],
  ["Debate Union", "Structured debates, policy discussions, and public speaking practice.", "Literary"],
  ["DataVerse Lab", "Analytics projects, dashboards, and data science learning circles.", "Technology"],
  ["Wellness Guild", "Mental wellness circles, peer support, and stress management sessions.", "Wellness"],
  ["Career Catalyst Club", "Placement readiness, mock interviews, and portfolio review programs.", "Career"],
];

const eventTemplates = [
  [0, "Campus Hack Sprint", "A fast-paced coding challenge where teams build practical student tools in one day.", "Technology", 6, 10, "Innovation Lab, Block B", 160, "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80"],
  [0, "Intro to Web APIs", "Hands-on workshop for building REST APIs with practical campus examples.", "Technology", 2, 14, "Tech Seminar Hall", 80, "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80"],
  [2, "Open Mic Evening", "An ongoing celebration of music, poetry, and storytelling from students.", "Cultural", 0, 18, "Main Auditorium", 140, "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80"],
  [1, "Robo Basics Workshop", "Completed introductory workshop on sensors, motors, and robot build basics.", "Engineering", -5, 11, "Mechanical Lab 2", 60, "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80"],
  [3, "Campus Clean Drive", "Volunteer cleanup campaign with reusable kit distribution.", "Social", 4, 8, "College Main Gate", 120, "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80"],
  [4, "Startup Pitch Clinic", "Pitch your startup idea and get live feedback from alumni founders.", "Entrepreneurship", 10, 16, "Business Incubation Hub", 90, "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80"],
  [4, "Resume and LinkedIn Lab", "Career branding session for internships and placements.", "Career", -2, 15, "Placement Cell Room", 70, "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80"],
  [5, "Morning Fitness Jam", "A guided fitness and mobility session for all students.", "Sports", 1, 7, "Sports Ground", 110, "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80"],
  [2, "Street Play for Awareness", "Team-based stage street play about digital safety.", "Cultural", -8, 17, "Open Stage Courtyard", 75, "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80"],
  [6, "Campus Photo Walk", "Golden-hour photo walk with composition challenges and mentor review.", "Media", 3, 16, "Library Steps", 55, "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80"],
  [7, "Inter-Department Debate", "A tournament-style debate on technology, society, and campus life.", "Literary", 5, 13, "Seminar Hall C", 96, "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80"],
  [8, "Data Dashboard Bootcamp", "Build a live analytics dashboard from registration and club activity data.", "Technology", 7, 12, "Analytics Lab", 85, "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"],
  [9, "Mindful Midweek", "Guided mindfulness, journaling prompts, and stress reset techniques.", "Wellness", 9, 9, "Wellness Center", 70, "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80"],
  [10, "Mock Interview Marathon", "Rotating mock interviews with manager feedback and scoring rubrics.", "Career", 12, 10, "Placement Cell", 120, "https://images.unsplash.com/photo-1565688534245-05d6b5be184a?auto=format&fit=crop&w=1200&q=80"],
];

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

  const [admin, ...users] = await User.create([
    {
      name: "Campus Admin",
      email: "admin@campusconnect.test",
      passwordHash,
      role: "admin",
    },
    ...managerNames.map((name, index) => ({
      name,
      email: `manager${index + 1}@campusconnect.test`,
      passwordHash,
      role: "manager",
    })),
    ...studentProfiles.map(([name], index) => ({
      name,
      email: `student${index + 1}@campusconnect.test`,
      passwordHash,
      role: "student",
    })),
  ]);

  const managers = users.slice(0, managerNames.length);
  const students = users.slice(managerNames.length);

  const clubs = await Club.create(
    clubTemplates.map(([name, description, category], index) => ({
      name,
      description,
      category,
      manager: managers[index]._id,
      members: students.filter((_, studentIndex) => (studentIndex + index) % 3 !== 1).map((student) => student._id),
    }))
  );

  await Promise.all(
    students.map((student, studentIndex) => {
      const joinedClubs = clubs
        .filter((_, clubIndex) => (studentIndex + clubIndex) % 3 !== 1)
        .map((club) => club._id);
      return User.findByIdAndUpdate(student._id, { $set: { joinedClubs } });
    })
  );

  const events = await Event.create(
    eventTemplates.map(([clubIndex, title, description, category, dayOffset, hour, venue, maxParticipants, posterUrl]) => {
      const eventDate = buildDateAt(dayOffset, hour);
      const club = clubs[clubIndex];
      return {
        club: club._id,
        title,
        description,
        category,
        date: eventDate,
        venue,
        maxParticipants,
        registrationDeadline: buildRegistrationDeadline(eventDate, dayOffset <= 0 ? 0 : 1),
        posterUrl,
        createdBy: club.manager,
      };
    })
  );

  const registrations = [];
  students.forEach((student, studentIndex) => {
    const [name, department, year] = studentProfiles[studentIndex];
    events.forEach((event, eventIndex) => {
      const club = clubs.find((item) => item._id.toString() === event.club.toString());
      const isMember = club.members.some((memberId) => memberId.toString() === student._id.toString());
      if (isMember && (studentIndex + eventIndex) % 4 !== 0) {
        registrations.push({
          user: student._id,
          event: event._id,
          club: event.club,
          name,
          email: student.email,
          phone: `987654${String(1000 + studentIndex).slice(-4)}`,
          department,
          year,
        });
      }
    });
  });

  await Registration.create(registrations);

  await ActivityLog.create(
    clubs.map((club, index) => ({
      manager: club.manager,
      actor: admin._id,
      actorName: admin.name,
      action: "club_seeded",
      details: `Seeded ${club.name} with ${club.members.length} active members.`,
      club: club._id,
      createdAt: buildDateAt(-index, 10),
    }))
  );

  console.log("Seed complete.");
  console.log("Demo credentials (password for all): Campus@123");
  console.log("admin@campusconnect.test (admin)");
  console.log("manager1@campusconnect.test through manager20@campusconnect.test (manager)");
  console.log("student1@campusconnect.test through student20@campusconnect.test (student)");
  console.log(
    `Seeded users: ${1 + managers.length + students.length}, clubs: ${clubs.length}, events: ${events.length}, registrations: ${registrations.length}`
  );

  await disconnectDB();
};

runSeed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await disconnectDB();
  process.exit(1);
});
