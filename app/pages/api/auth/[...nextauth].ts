import NextAuth from "next-auth/next";
import AzureProvider from "next-auth/providers/azure-ad";

export default NextAuth({
    providers: [
        AzureProvider({
            clientId: process.env.AZURE_CLIENT_ID!,
            clientSecret: process.env.AZURE_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID!,
        })
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.idToken = token.idToken;
            return session;
        }
    }
});