/**
 * Database Seed Script
 * Run with: npx tsx src/scripts/seed.ts
 *
 * Seeds:
 *  - ShopItem catalog (themes, frames, badges, streak_freeze)
 *  - AchievementDefinition catalog
 */

import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
import ShopItem from "@/models/ShopItem";
import { AchievementDefinition } from "@/models/Achievement";
import User from "@/models/User";
import Streak from "@/models/Streak";
import Task from "@/models/Task";
import TaskCompletion from "@/models/TaskCompletion";
import UserAttribute from "@/models/UserAttribute";

const shopItems = [
  {
    name: "Cyberpunk Neon Theme",
    description:
      "Unlock the neon-drenched Cyberpunk theme. Glitch-text effects and glowing progress bars included.",
    type: "theme" as const,
    goldCost: 500,
    itemKey: "theme_cyberpunk",
    requiredLevel: 5,
    isActive: true,
    previewImageUrl: null,
  },
  {
    name: "Dragon Frame",
    description: "A golden dragon wraps around your avatar.",
    type: "avatar_frame" as const,
    goldCost: 200,
    itemKey: "frame_dragon",
    requiredLevel: null,
    isActive: true,
    previewImageUrl: null,
  },
  {
    name: "Paladin Crest",
    description: "Holy defensive crest for the disciplined champion.",
    type: "avatar_frame" as const,
    goldCost: 150,
    itemKey: "frame_paladin",
    requiredLevel: null,
    isActive: true,
    previewImageUrl: null,
  },
  {
    name: "Cyber Ninja Frame",
    description: "Futuristic neon stealth visor and shroud.",
    type: "avatar_frame" as const,
    goldCost: 250,
    itemKey: "frame_ninja",
    requiredLevel: 3,
    isActive: true,
    previewImageUrl: null,
  },
  {
    name: "Streak Freeze",
    description:
      "Protects your streak for one missed day. Use it wisely — you can hold up to 3.",
    type: "streak_freeze" as const,
    goldCost: 100,
    itemKey: "consumable_streak_freeze",
    requiredLevel: null,
    isActive: true,
    previewImageUrl: null,
  },
  {
    name: "Scholar Badge",
    description: "Recognizes unwavering dedication to intellect and knowledge.",
    type: "badge" as const,
    goldCost: 80,
    itemKey: "badge_scholar",
    requiredLevel: null,
    isActive: true,
    previewImageUrl: null,
  },
  {
    name: "Centurion Badge",
    description: "Awarded to those who have achieved legendary consistency.",
    type: "badge" as const,
    goldCost: 200,
    itemKey: "badge_centurion",
    requiredLevel: 5,
    isActive: true,
    previewImageUrl: null,
  },
];

const achievements = [
  {
    key: "FIRST_TASK",
    title: "First Blood",
    description: "Complete your very first task.",
    xpBonus: 50,
    criteria: { type: "task_count" as const, threshold: 1 },
    isGoldExclusive: false,
  },
  {
    key: "COMPLETE_10_TASKS",
    title: "Getting Started",
    description: "Complete 10 tasks total.",
    xpBonus: 100,
    criteria: { type: "task_count" as const, threshold: 10 },
    isGoldExclusive: false,
  },
  {
    key: "COMPLETE_50_TASKS",
    title: "Grinder",
    description: "Complete 50 tasks total.",
    xpBonus: 300,
    criteria: { type: "task_count" as const, threshold: 50 },
    isGoldExclusive: false,
  },
  {
    key: "COMPLETE_50_FITNESS",
    title: "Iron Body",
    description: "Complete 50 Strength/Fitness tasks.",
    xpBonus: 300,
    criteria: {
      type: "task_count" as const,
      category: "Strength",
      threshold: 50,
    },
    isGoldExclusive: false,
  },
  {
    key: "STREAK_7",
    title: "Week Warrior",
    description: "Maintain a 7-day streak.",
    xpBonus: 100,
    criteria: { type: "streak_milestone" as const, threshold: 7 },
    isGoldExclusive: false,
  },
  {
    key: "STREAK_30",
    title: "Monthly Legend",
    description: "Maintain a 30-day streak.",
    xpBonus: 500,
    criteria: { type: "streak_milestone" as const, threshold: 30 },
    isGoldExclusive: false,
  },
  {
    key: "STREAK_100",
    title: "Centurion",
    description: "Maintain a 100-day streak.",
    xpBonus: 2000,
    criteria: { type: "streak_milestone" as const, threshold: 100 },
    isGoldExclusive: false,
  },
  {
    key: "LEVEL_10",
    title: "Adept",
    description: "Reach character level 10.",
    xpBonus: 0,
    criteria: { type: "global_level" as const, threshold: 10 },
    isGoldExclusive: false,
  },
  {
    key: "INTELLECT_10",
    title: "Scholar",
    description: "Reach Intellect level 10.",
    xpBonus: 200,
    criteria: {
      type: "attribute_level" as const,
      attribute: "Intellect",
      threshold: 10,
    },
    isGoldExclusive: false,
  },
];

async function seed() {
  await connectDB();
  console.log("🌱 Seeding database...");

  // Upsert shop items
  for (const item of shopItems) {
    await ShopItem.findOneAndUpdate({ itemKey: item.itemKey }, item, {
      upsert: true,
      new: true,
    });
    console.log(`  ✓ ShopItem: ${item.name}`);
  }

  // Upsert achievement definitions
  for (const ach of achievements) {
    await AchievementDefinition.findOneAndUpdate({ key: ach.key }, ach, {
      upsert: true,
      new: true,
    });
    console.log(`  ✓ Achievement: ${ach.title}`);
  }

  // Seed sample realm champions for competitive leaderboard
  console.log("⚔️ Seeding realm heroes...");
  const championAccounts = [
    {
      email: "astraea@liferpg.realm",
      username: "Astraea_Paladin",
      level: 8,
      totalXp: 1450,
      gold: 180,
      avatarFrame: "frame_paladin",
      currentStreak: 12,
      longestStreak: 15,
      tasksCount: 24,
    },
    {
      email: "shadowblade@liferpg.realm",
      username: "ShadowBlade",
      level: 6,
      totalXp: 820,
      gold: 120,
      avatarFrame: "frame_ninja",
      currentStreak: 7,
      longestStreak: 10,
      tasksCount: 16,
    },
    {
      email: "valkyrie@liferpg.realm",
      username: "CyberValkyrie",
      level: 4,
      totalXp: 460,
      gold: 90,
      avatarFrame: "frame_dragon",
      currentStreak: 5,
      longestStreak: 8,
      tasksCount: 9,
    },
    {
      email: "ironclad@liferpg.realm",
      username: "IronClad_Monk",
      level: 2,
      totalXp: 140,
      gold: 40,
      avatarFrame: null,
      currentStreak: 3,
      longestStreak: 4,
      tasksCount: 4,
    },
  ];

  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);
  const ATTRIBUTES = ["Strength", "Intellect", "Discipline", "Creativity", "Social"] as const;

  for (const hero of championAccounts) {
    let u = await User.findOne({ username: hero.username });
    if (!u) {
      u = await User.create({
        email: hero.email,
        passwordHash: defaultPasswordHash,
        username: hero.username,
        level: hero.level,
        totalXp: hero.totalXp,
        gold: hero.gold,
        avatarFrame: hero.avatarFrame,
      });
      console.log(`  ✓ Created Hero: ${hero.username}`);

      // Seed attributes
      for (const attr of ATTRIBUTES) {
        await UserAttribute.create({
          userId: u._id,
          attribute: attr,
          level: Math.max(1, Math.floor(hero.level / 2)),
          xp: Math.floor(hero.totalXp / 5),
        });
      }
    }

    // Upsert streak
    await Streak.findOneAndUpdate(
      { userId: u._id },
      {
        userId: u._id,
        currentStreak: hero.currentStreak,
        longestStreak: hero.longestStreak,
      },
      { upsert: true, new: true }
    );

    // Ensure sample task completions count matches tasksCount
    const existingCount = await TaskCompletion.countDocuments({ userId: u._id });
    if (existingCount < hero.tasksCount) {
      let sampleTask = await Task.findOne({ userId: u._id });
      if (!sampleTask) {
        sampleTask = await Task.create({
          userId: u._id,
          title: "Daily Realm Training",
          category: "Strength",
          difficulty: "Medium",
          recurrence: "Daily",
        });
      }
      for (let i = existingCount; i < hero.tasksCount; i++) {
        await TaskCompletion.create({
          taskId: sampleTask._id,
          userId: u._id,
          taskSnapshot: {
            title: sampleTask.title,
            category: sampleTask.category,
            difficulty: sampleTask.difficulty,
          },
          xpAwarded: 50,
          goldAwarded: 10,
          attributeXpAwarded: 50,
          clientRequestId: `seed-${hero.username}-${i}-${Date.now()}`,
          streakDayDate: "2026-09-12",
        });
      }
    }
    console.log(`  ✓ Synced Hero: ${hero.username} (Lv ${hero.level}, ${hero.totalXp} XP, ${hero.tasksCount} tasks)`);
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
