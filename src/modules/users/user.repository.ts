import { getDatabaseExecutor } from '@/db/client';

export interface UserEntity {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  role?: 'customer' | 'admin';
}

export class UserRepository {
  private db = getDatabaseExecutor();

  async findByEmail(email: string): Promise<UserEntity | null> {
    const rows = await this.db.query<UserEntity>(
      `SELECT id, email, password_hash, full_name, phone, role, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1;`,
      [email.trim()]
    );
    return rows[0] || null;
  }

  async findById(id: number): Promise<UserEntity | null> {
    const rows = await this.db.query<UserEntity>(
      `SELECT id, email, password_hash, full_name, phone, role, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1;`,
      [id]
    );
    return rows[0] || null;
  }

  async createUser(input: CreateUserInput): Promise<UserEntity> {
    const role = input.role || 'customer';
    const rows = await this.db.query<UserEntity>(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, password_hash, full_name, phone, role, created_at, updated_at;`,
      [
        input.email.trim().toLowerCase(),
        input.passwordHash,
        input.fullName.trim(),
        input.phone?.trim() || null,
        role,
      ]
    );
    return rows[0];
  }
}
