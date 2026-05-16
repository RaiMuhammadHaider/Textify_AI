import { ReactNode, useCallback } from "react";
import { User as StreamUser } from "stream-chat";
import { User } from "../types/auth";
import { Chat, useCreateChatClient } from "stream-chat-react";
import { LoadingScreen } from "../components/loading-screen";
import { useTheme } from "../hooks/use-theme";

interface ChatProviderProps {
  user: User;
  children: ReactNode;
}

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;
const backendUrl = import.meta.env.VITE_AI_URL as string;

if (!apiKey) {
  throw new Error("Missing VITE_STREAM_API_KEY in .env file");
}

export const ChatProvider = ({ user, children }: ChatProviderProps) => {
  const { theme } = useTheme();

  /**
   * Token provider function that fetches authentication tokens from our backend.
   */
  const tokenProvider = useCallback(async () => {
    if (!user) {
      throw new Error("User not available");
    }

    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${backendUrl}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch token: ${errorText}`);
      }

      const { token } = await response.json();
      return token;
    } catch (err) {
      console.error("Error fetching token:", err);
      throw err;
    }
  }, [user]);

  /**
   * Create the Stream Chat client with automatic token management.
   */
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: user as unknown as StreamUser,
  });

  // Show loading screen while client is being initialized
  if (!client) {
    return <LoadingScreen />;
  }

  return (
    <Chat
      client={client}
      theme={
        theme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light"
      }
    >
      {children}
    </Chat>
  );
};

