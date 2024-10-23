import { UserData, Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import { retrievePrismaClient } from "../db/postgres";
import { NotificationUserData } from "../types/notifications";

export class UserDataRepository {
    private model: Prisma.UserDataDelegate<DefaultArgs>;

    constructor() {
        this.model = retrievePrismaClient().userData;
    }

    /**
     * Creates the user notification data in the repository.
     * 
     * @param data - The data payload of the user data.
     * @returns A Promise that resolves to the user's information or null if not found.
     */ 
    async create(payload: NotificationUserData): Promise<UserData> {
        const { uid, name, email, phone_number } = payload
        const data = { uid, name, email, phone_number } as UserData;
        return await this.model.create({ data });
    }

    /**
     * Retrieves the notification data of a user from the repository by user id.
     * 
     * @param userId - The ID of the user.
     * @returns A Promise that resolves to the user's information or null if not found.
     */ 
    async findByUid(userId: string): Promise<UserData | null> {
        return await this.model.findUnique({ 
            where: { uid: userId}
        })
    }

    /**
     * Updates the notification data of a user in the repository.
     * 
     * @param userId - The ID of the user.
     * @returns A Promise that resolves to the user's information or null if not found.
     */ 
    async updateByUid(userId: string, item: Partial<UserData>): Promise<UserData | null> {
        return await this.model.update({ 
            where: { uid: userId },
            data: item
        });
    }
}