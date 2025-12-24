import 'dotenv/config';

type TimeSpanText = `${number}${"s" | "m" | "h" | "d"}`;

// console.log("PROCESS:", process);
/**
 * Cách 1: export từng biến môi trường
 * !Khi import: import { DATABASE_URL, ACCESS_TOKEN_SECRET, ...} from './src/common/constant/app.constant.js';
 * !Khi dùng: const dbURL = DATABASE_URL, ats = ACCESS_TOKEN_SECRET, ...
 */
export const DATABASE_URL = process.env.DATABASE_URL;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
// export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const PORT = Number(process.env.PORT ?? 3000);

export const DATABASE_PORT = Number(process.env.DATABASE_PORT ?? 3307);
export const DATABASE_HOST = process.env.DATABASE_HOST;
export const DATABASE_USER = process.env.DATABASE_USER;
export const DATABASE_NAME = process.env.DATABASE_NAME;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;

//TTL: Time To Live
export const ACCESS_TOKEN_TTL: TimeSpanText = (process.env.ACCESS_TOKEN_TTL ?? "600m") as TimeSpanText;
export const REFRESH_TOKEN_TTL: TimeSpanText = (process.env.REFRESH_TOKEN_TTL ?? "5d") as TimeSpanText;

// Validate sớm
if (!ACCESS_TOKEN_SECRET) throw new Error("Missing ACCESS_TOKEN_SECRET");
if (!REFRESH_TOKEN_SECRET) throw new Error("Missing REFRESH_TOKEN_SECRET");


console.log('\n',
    {
        DATABASE_URL: DATABASE_URL,
        ACCESS_TOKEN_SECRET: ACCESS_TOKEN_SECRET,
        // GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
        // GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET,
        REFRESH_TOKEN_SECRET: REFRESH_TOKEN_SECRET,
        DATABASE_HOST,
        DATABASE_PORT,
        DATABASE_USER,
        DATABASE_NAME,
        DATABASE_PASSWORD
    },
    '\n'
); //Chỉ dành cho dev check (if any), lên Production thì disabled

/**
 * Cách 2: export tất cả biến môi trường trong 1 object
 * !Khi import: import env from './src/common/constant/app.constant.js';
 * !Khi dùng: const dbURL = env.DATABASE_URL, ats = env.ACCESS_TOKEN_SECRET, ...
 */
// const env = {
//     DATABASE_URL: process.env.DATABASE_URL,
//     ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
//     GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
//     GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
// }

// export default env;