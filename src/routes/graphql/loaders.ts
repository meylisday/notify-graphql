import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export function getLoaders(prisma: PrismaClient) {
  const batchGetMemberTypes = async (keys: ReadonlyArray<string>) => {
    return prisma.memberType.findMany({
      where: {
        id: { in: keys as string[] },
      },
    });
  };

  const batchGetPosts = async (keys: ReadonlyArray<string>) => {
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: keys as string[] },
      },
    });

    const groupedPosts: Record<string, unknown[]> = {};
    for (const post of posts) {
      if (!groupedPosts[post.authorId]) {
        groupedPosts[post.authorId] = [];
      }
      groupedPosts[post.authorId].push(post);
    }

    return keys.map((key) => (groupedPosts[key]?.length ? groupedPosts[key] : null));
  };

  const batchGetUsers = async (keys: ReadonlyArray<string>) => {
    const usersMap: Record<string, unknown> = {};
    const users = await prisma.user.findMany({
      where: {
        id: { in: keys as string[] },
      },
    });

    for (const user of users) {
      usersMap[user.id] = user;
    }

    return keys.map((key) => usersMap[key] ?? null);
  };

  const batchGetUserSubscribedTo = async (keys: ReadonlyArray<string>) => {
    const usersMap: Record<string, string[]> = {};
    const users = await prisma.user.findMany({
      include: {
        userSubscribedTo: true,
      },
      where: {
        id: { in: keys as string[] },
      },
    });

    for (const user of users) {
      const subscribers = user.userSubscribedTo.map(({ authorId }) => authorId);
      usersMap[user.id] = subscribers;
    }

    return keys.map((key) => usersMap[key] ?? []);
  };

  const batchGetSubscribedToUser = async (keys: ReadonlyArray<string>) => {
    const usersMap: Record<string, string[]> = {};
    const users = await prisma.user.findMany({
      include: {
        subscribedToUser: true,
      },
      where: {
        id: { in: keys as string[] },
      },
    });

    for (const user of users) {
      const subscribers = user.subscribedToUser.map(({ subscriberId }) => subscriberId);
      usersMap[user.id] = subscribers;
    }

    return keys.map((key) => usersMap[key] ?? []);
  };

  const batchGetProfiles = async (keys: ReadonlyArray<string>) => {
    const profilesMap: Record<string, unknown> = {};
    const profiles = await prisma.profile.findMany({
      where: {
        userId: { in: keys as string[] },
      },
    });

    for (const profile of profiles) {
      profilesMap[profile.userId] = profile;
    }

    return keys.map((key) => profilesMap[key] ?? null);
  };

  const postsLoader = new DataLoader(batchGetPosts, { cache: true });
  const memberTypeLoader = new DataLoader(batchGetMemberTypes, { cache: true });
  const profileLoader = new DataLoader(batchGetProfiles, { cache: true });
  const usersLoader = new DataLoader(batchGetUsers, { cache: true });
  const userSubscribedToLoader = new DataLoader(batchGetUserSubscribedTo, {
    cache: true,
  });
  const subscribedToUserLoader = new DataLoader(batchGetSubscribedToUser, {
    cache: true,
  });

  return {
    postsLoader,
    memberTypeLoader,
    profileLoader,
    usersLoader,
    userSubscribedToLoader,
    subscribedToUserLoader
  }
}