import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Notification } from "../models/Notification.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Announcement } from "../models/Announcement.js";
import { JoinRequest } from "../models/JoinRequest.js";
import { PointLedger } from "../models/PointLedger.js";

const buildDateAt = (offsetDays, hour = 12) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
};

const deadlineFor = (eventDate, daysBefore = 2) => {
  const date = new Date(eventDate);
  date.setDate(date.getDate() - daysBefore);
  return date;
};

const image = (query) =>
  `https://images.unsplash.com/${query}?auto=format&fit=crop&w=1400&q=80`;

const studentsSeed = [
  ["Aarav Mehta", "Computer Science", "2nd Year"],
  ["Diya Shah", "Information Technology", "3rd Year"],
  ["Kabir Rao", "Mechanical", "2nd Year"],
  ["Anaya Iyer", "Design", "1st Year"],
  ["Rohan Patel", "Computer Science", "4th Year"],
  ["Meera Nair", "Business Administration", "3rd Year"],
  ["Ishaan Gupta", "Electronics", "2nd Year"],
  ["Sana Ali", "Mass Communication", "1st Year"],
  ["Dev Menon", "Data Science", "3rd Year"],
  ["Nisha Kapoor", "Commerce", "2nd Year"],
  ["Harsh Jain", "Electrical", "4th Year"],
  ["Tara Mehta", "Computer Applications", "2nd Year"],
];

const clubsSeed = [
  {
    name: "E-Cell",
    category: "Entrepreneurship",
    manager: "Riya Shah",
    description: "A founder-first campus community for startup ideas, pitch practice, market research, and student venture building.",
    logoUrl: image("photo-1552664730-d307ca884978"),
    bannerUrl: image("photo-1559136555-9303baea8ebd"),
  },
  {
    name: "GrowthSquare",
    category: "Web Development, DSA, UI/UX, 3D Animation",
    manager: "Arjun Verma",
    description: "A multidisciplinary tech club helping students ship web apps, sharpen DSA, design interfaces, and explore 3D creation.",
    logoUrl: image("photo-1515879218367-8466d910aaa4"),
    bannerUrl: image("photo-1498050108023-c5249f4df085"),
  },
  {
    name: "Code4All",
    category: "DSA and Problem Solving",
    manager: "Sara Khan",
    description: "Peer-led coding circles, problem-solving ladders, contests, and interview preparation for every programming level.",
    logoUrl: image("photo-1461749280684-dccba630e2f6"),
    bannerUrl: image("photo-1517180102446-f3ece451e9d8"),
  },
  {
    name: "The Persona Community",
    category: "Personality Development and Public Speaking",
    manager: "Devika Nair",
    description: "A communication lab for confident speaking, interview readiness, stage presence, leadership, and personal branding.",
    logoUrl: image("photo-1543269865-cbf427effbad"),
    bannerUrl: image("photo-1517048676732-d65bc937f952"),
  },
  {
    name: "GDG (Google Developer Group)",
    category: "Google Technologies and AI",
    manager: "Manav Joshi",
    description: "Campus developer sessions around Android, Flutter, Firebase, Google Cloud, AI tooling, and solution challenges.",
    logoUrl: image("photo-1555949963-aa79dcee981c"),
    bannerUrl: image("photo-1550751827-4bd374c3f58b"),
  },
  {
    name: "DesignNoCode",
    category: "UI/UX Design",
    manager: "Tanya Kapoor",
    description: "Design critique, no-code prototyping, UX research practice, and product thinking for students building usable experiences.",
    logoUrl: image("photo-1559028012-481c04fa702d"),
    bannerUrl: image("photo-1581291518857-4e27b48ff24e"),
  },
  {
    name: "Infinity Racers",
    category: "Formula 1 and Vehicle Design",
    manager: "Kabir Malhotra",
    description: "A vehicle design team focused on aerodynamics, CAD, suspension basics, telemetry thinking, and F1-inspired challenges.",
    logoUrl: image("photo-1503376780353-7e6692767b70"),
    bannerUrl: image("photo-1532974297617-c0f05fe48bff"),
  },
  {
    name: "PixelForge",
    category: "Creative Media and Content Creation",
    manager: "Asha Menon",
    description: "A creative studio for campus reels, photography, content strategy, motion graphics, and brand storytelling.",
    logoUrl: image("photo-1452587925148-ce544e77e70d"),
    bannerUrl: image("photo-1492691527719-9d1e07e534b4"),
  },
  {
    name: "Cyber Nexus",
    category: "Cybersecurity and Ethical Hacking",
    manager: "Nikhil Sinha",
    description: "Security-first learning through CTFs, secure coding, ethical hacking labs, awareness drives, and blue-team basics.",
    logoUrl: image("photo-1563986768609-322da13575f3"),
    bannerUrl: image("photo-1550751827-4bd374c3f58b"),
  },
];

const eventGroups = [
  ["College Events", [
    ["Pravaah", "A flagship cultural fest with music, dance, theatre, fashion, and inter-department showcases.", "Cultural Fest", "Main Auditorium", 7, image("photo-1514525253161-7a46d19cd819")],
    ["Raasotsav", "A vibrant Holi celebration with safe colors, live DJ, food stalls, and student performances.", "Holi Celebration", "Central Ground", 14, image("photo-1528495612343-9ca9f4a4de28")],
  ]],
  ["GDG (Google Developer Group)", [
    ["AI Odyssey", "Explore practical AI workflows with Gemini, prompt design, and rapid prototyping labs.", "AI", "Google Developer Lab", 4, image("photo-1677442136019-21780ecad995")],
    ["AI Solution Challenge", "Build meaningful AI solutions for campus or community problems with mentor checkpoints.", "AI", "Innovation Studio", 19, image("photo-1531482615713-2afd69097998")],
    ["Flutter Fusion", "A hands-on Flutter sprint covering UI, state, navigation, and Firebase integration.", "Mobile Development", "Mobile Lab", 25, image("photo-1551650975-87deedd944c3")],
    ["GenAI Bootcamp", "A two-day bootcamp on generative AI apps, responsible usage, and deployment basics.", "Generative AI", "Seminar Hall B", 32, image("photo-1620712943543-bcc4688e7485")],
  ]],
  ["GrowthSquare", [
    ["WebVerse", "Teams design and deploy a polished web experience around a real student-life problem.", "Web Development", "Computer Center", 6, image("photo-1498050108023-c5249f4df085")],
    ["UI/UX Sprint", "A timed design sprint from research notes to interactive prototype and critique.", "UI/UX", "Design Studio", 11, image("photo-1581291518857-4e27b48ff24e")],
    ["DSA Arena", "A contest-style DSA battle with ladders for beginner, intermediate, and advanced coders.", "DSA", "Lab 204", 17, image("photo-1515879218367-8466d910aaa4")],
    ["BlenderX Workshop", "Introductory 3D animation workshop covering modeling, lighting, and campus-themed renders.", "3D Animation", "Media Lab", 28, image("photo-1633356122544-f134324a6cee")],
  ]],
  ["Code4All", [
    ["CodeStorm", "A fast-paced coding contest focused on arrays, graphs, dynamic programming, and clean solutions.", "Problem Solving", "Programming Lab", 5, image("photo-1461749280684-dccba630e2f6")],
    ["AlgoRush", "Algorithm drills, pair solving, and post-contest editorial walkthroughs.", "Algorithms", "Lab 101", 13, image("photo-1517180102446-f3ece451e9d8")],
    ["Weekly Coding Battles", "Recurring friendly contests with rank tracking and mentor feedback.", "Coding Contest", "Online + Lab 202", 21, image("photo-1504384308090-c894fdcc538d")],
  ]],
  ["DesignNoCode", [
    ["Figma Jam", "Collaborative Figma exercises on components, auto layout, responsive frames, and design critique.", "UI/UX Design", "Design Studio", 8, image("photo-1559028012-481c04fa702d")],
    ["Designathon", "A product design marathon where teams solve a campus workflow with research-backed prototypes.", "Design Challenge", "Innovation Hub", 24, image("photo-1542744173-8e7e53415bb0")],
  ]],
  ["Infinity Racers", [
    ["F1 Car Design Challenge", "Teams present aerodynamic concepts, vehicle packaging, and design trade-offs inspired by F1.", "Vehicle Design", "Mechanical Workshop", 15, image("photo-1503376780353-7e6692767b70")],
    ["AeroMod Workshop", "Hands-on session on aero surfaces, drag reduction, and model testing fundamentals.", "Aerodynamics", "Mechanical CAD Lab", 27, image("photo-1532974297617-c0f05fe48bff")],
  ]],
  ["E-Cell", [
    ["Startup PitchFest", "Student founders pitch early ideas to alumni founders and receive structured feedback.", "Entrepreneurship", "Incubation Hub", 10, image("photo-1556761175-b413da4baf72")],
    ["BizQuest", "A business strategy quest with market sizing, pricing, branding, and negotiation rounds.", "Business Challenge", "MBA Seminar Hall", 18, image("photo-1552664730-d307ca884978")],
    ["Founder Meetup", "An informal founder circle featuring lessons from campus alumni building real startups.", "Founder Talk", "Incubation Lounge", 30, image("photo-1559136555-9303baea8ebd")],
  ]],
  ["PixelForge", [
    ["ReelRush", "A short-form video sprint for campus stories, event promos, and editing workflows.", "Creative Media", "Media Studio", 9, image("photo-1492691527719-9d1e07e534b4")],
    ["CreatorCamp", "Workshops on content calendars, campus branding, photography basics, and creator ethics.", "Content Creation", "AV Room", 23, image("photo-1452587925148-ce544e77e70d")],
  ]],
  ["Cyber Nexus", [
    ["Capture The Flag", "A beginner-friendly CTF with web, crypto, OSINT, and reverse-engineering challenges.", "Cybersecurity", "Cyber Lab", 12, image("photo-1563986768609-322da13575f3")],
    ["CyberShield Workshop", "Practical training on password hygiene, phishing defense, secure coding, and incident basics.", "Ethical Hacking", "Seminar Hall C", 26, image("photo-1550751827-4bd374c3f58b")],
  ]],
];

const runSeed = async () => {
  await connectDB();

  await Promise.all([
    ActivityLog.deleteMany({}),
    Announcement.deleteMany({}),
    JoinRequest.deleteMany({}),
    Notification.deleteMany({}),
    PointLedger.deleteMany({}),
    Registration.deleteMany({}),
    Event.deleteMany({}),
    Club.deleteMany({}),
    User.deleteMany({ role: { $ne: "admin" }, email: /@campusconnect\.test$/ }),
    User.updateMany({}, { $set: { joinedClubs: [], points: 0 } }),
  ]);

  const password = "Campus@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await User.findOneAndUpdate(
    { email: "admin@campusconnect.test" },
    {
      $setOnInsert: {
        name: "Campus Admin",
        email: "admin@campusconnect.test",
        passwordHash,
        role: "admin",
      },
    },
    { upsert: true, new: true }
  );

  const managers = await User.create(
    clubsSeed.map((club, index) => ({
      name: club.manager,
      email: `manager${index + 1}@campusconnect.test`,
      passwordHash,
      role: "manager",
      points: 10,
    }))
  );

  const students = await User.create(
    studentsSeed.map(([name], index) => ({
      name,
      email: `student${index + 1}@campusconnect.test`,
      passwordHash,
      role: "student",
      points: 10,
    }))
  );

  const clubs = await Club.create(
    clubsSeed.map((club, index) => ({
      name: club.name,
      description: club.description,
      category: club.category,
      logoUrl: club.logoUrl,
      bannerUrl: club.bannerUrl,
      manager: managers[index]._id,
      members: students.filter((_, studentIndex) => (studentIndex + index) % 3 === 0).map((student) => student._id),
    }))
  );

  await Promise.all(
    students.map((student) => {
      const joinedClubs = clubs.filter((club) => club.members.some((memberId) => memberId.equals(student._id))).map((club) => club._id);
      return User.findByIdAndUpdate(student._id, {
        $set: {
          joinedClubs,
          points: 10 + joinedClubs.length * 50,
        },
      });
    })
  );

  const clubByName = new Map(clubs.map((club) => [club.name, club]));
  const collegeClub = clubs[0];
  const eventsToCreate = [];

  eventGroups.forEach(([clubName, events]) => {
    const club = clubByName.get(clubName) || collegeClub;
    events.forEach(([title, description, category, venue, dayOffset, posterUrl], eventIndex) => {
      const date = buildDateAt(dayOffset, 10 + (eventIndex % 6));
      eventsToCreate.push({
        club: club._id,
        title,
        description,
        category,
        venue,
        date,
        posterUrl,
        status: "scheduled",
        maxParticipants: 80 + eventIndex * 20,
        registrationDeadline: deadlineFor(date),
        createdBy: club.manager,
      });
    });
  });

  const events = await Event.create(eventsToCreate);
  const registrations = [];
  students.forEach((student, studentIndex) => {
    const [name, department, year] = studentsSeed[studentIndex];
    events.forEach((event, eventIndex) => {
      const club = clubs.find((item) => item._id.equals(event.club));
      const isMember = club.members.some((memberId) => memberId.equals(student._id));
      if (isMember && (studentIndex + eventIndex) % 4 === 0) {
        registrations.push({
          user: student._id,
          event: event._id,
          club: event.club,
          name,
          email: student.email,
          phone: `98765${String(41000 + studentIndex).slice(-5)}`,
          department,
          year,
        });
      }
    });
  });

  await Registration.create(registrations);

  const registrationCountsByStudent = new Map();
  const registrationCountsByManager = new Map();
  registrations.forEach((registration) => {
    registrationCountsByStudent.set(
      registration.user.toString(),
      (registrationCountsByStudent.get(registration.user.toString()) || 0) + 1
    );
    const club = clubs.find((item) => item._id.equals(registration.club));
    const managerId = club.manager.toString();
    registrationCountsByManager.set(managerId, (registrationCountsByManager.get(managerId) || 0) + 1);
  });

  await Promise.all([
    ...students.map((student) =>
      User.findByIdAndUpdate(student._id, {
        $inc: { points: (registrationCountsByStudent.get(student._id.toString()) || 0) * 20 },
      })
    ),
    ...managers.map((manager) => {
      const club = clubs.find((item) => item.manager.equals(manager._id));
      return User.findByIdAndUpdate(manager._id, {
        $inc: {
          points: (club?.members?.length || 0) * 50 + (registrationCountsByManager.get(manager._id.toString()) || 0) * 20,
        },
      });
    }),
  ]);

  await Announcement.create(
    clubs.slice(0, 6).map((club, index) => ({
      title: `${club.name} orientation and roadmap`,
      content: `Welcome to ${club.name}. The next cycle includes skill sessions, peer teams, and practical campus projects. Members should watch the dashboard for weekly updates.`,
      club: club._id,
      createdBy: club.manager,
      createdAt: buildDateAt(-index, 11),
    }))
  );

  await ActivityLog.create(
    clubs.map((club, index) => ({
      manager: club.manager,
      actor: admin._id,
      actorName: admin.name,
      action: "club_seeded",
      details: `Seeded ${club.name} with ${club.members.length} approved members.`,
      club: club._id,
      createdAt: buildDateAt(-index, 10),
    }))
  );

  console.log("Seed complete.");
  console.log("Demo credentials (password for all): Campus@123");
  console.log("admin@campusconnect.test (admin)");
  console.log(`manager1@campusconnect.test through manager${managers.length}@campusconnect.test (manager)`);
  console.log(`student1@campusconnect.test through student${students.length}@campusconnect.test (student)`);
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
