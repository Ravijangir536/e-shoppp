import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import CredentialProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { AuthOptions } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
        adapter: PrismaAdapter(prisma),
        providers: [
            GoogleProvider( {
                clientId: process.env.GOOGLE_CLIENT_ID as string,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            }),
    
            CredentialProvider({
                name: "credentials",
                credentials:{
                    email: {
                        label: "email",
                        type: "text"
                    },
                    password: {
                        label: "password",
                        type: "password"
                    },
                },
                async authorize(credentials){
                    if(!credentials?.email || !credentials.password){
                        throw new Error("Invalid email or password");
                    }
    
                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email,
                        },
                    });
    
                    if(!user || !user?.hashedPassword){
                        throw new Error("Invalid email or password");
                    }
    
                    const isCorrectPassword = await bcrypt.compare(
                        credentials.password,
                        user.hashedPassword
                    );
    
                    if(!isCorrectPassword){
                        throw new Error("Invalid email or password");
                    }
    
                    return user;
                },
            }),
        ],
        pages: {
            signIn: "/login"
        },
        debug: process.env.NODE_ENV === "development",
        session: {
            strategy: "jwt"
        },
        secret: process.env.NEXTAUTH_SECRET,
    }

export default NextAuth(authOptions);