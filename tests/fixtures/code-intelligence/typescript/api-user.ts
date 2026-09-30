import { createClient } from "@supabase/supabase-js";

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "user";
}

export type UserCreationPayload = Omit<UserDTO, "id">;

export class UserService {
  private supabase = createClient("https://example.supabase.co", "key");

  public async fetchUserById(userId: string): Promise<UserDTO | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    return data as UserDTO;
  }
}

export async function createUserHandler(req: any, res: any) {
  try {
    const service = new UserService();
    const result = await service.fetchUserById("123");
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Error" });
  }
}
