import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const retrievePrismaClient = () => {
    return prisma;
}

export const disconnectPrisma = async () => {
    await prisma.$disconnect();
}