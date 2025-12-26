import { faker } from '@faker-js/faker';
import { hash } from 'bcrypt';
import 'dotenv/config';
import { PrismaNeon } from '@prisma/adapter-neon';

import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  // 🔐 hash once
  const passwordHash = await hash('password123', 10);

  // 👤 create users
  const users = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          name: faker.person.fullName(),
          bio: faker.lorem.sentence(),
          avatar: faker.image.avatar(),
          password: passwordHash,
        },
      }),
    ),
  );

  const userIds = users.map((u) => u.id);

  // 📝 create posts
  const posts = await Promise.all(
    Array.from({ length: 30 }).map(() => {
      const title = faker.lorem.sentence();

      return prisma.post.create({
        data: {
          title,
          slug: generateSlug(title),
          content: faker.lorem.paragraphs(3),
          thumbnail: faker.image.urlLoremFlickr(),
          published: true,
          authorId: faker.helpers.arrayElement(userIds),
        },
      });
    }),
  );

  // 💬 create comments
  for (const post of posts) {
    await prisma.comment.createMany({
      data: Array.from({ length: 5 }).map(() => ({
        content: faker.lorem.sentences(2),
        authorId: faker.helpers.arrayElement(userIds),
        postId: post.id,
      })),
    });
  }

  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
