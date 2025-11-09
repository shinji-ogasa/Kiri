import { z } from 'zod';

const usernameRegex = /^[a-z0-9_]{3,20}$/;

export const signInSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上です'),
});

export const signUpSchema = signInSchema.extend({
  username: z
    .string()
    .regex(usernameRegex, 'ユーザーネームは小文字英数と下線で3〜20文字です'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
