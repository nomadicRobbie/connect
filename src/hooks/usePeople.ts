import { useCallback, useState } from "react";
import type { Message, User } from "../types";

// In-memory mock store — swap `mockStore` and `messageService` for a REST/socket
// implementation when the backend messaging endpoints are available.

const mockStore: Message[] = [
  {
    id: "1",
    authorId: "seed-1",
    authorName: "Alex T.",
    content: "Land Rover Discovery serviced and back in the yard. Ready to go.",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    authorId: "seed-2",
    authorName: "Sam K.",
    content: "Reminder: Lodge 3 generator inspection is due this Friday.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    authorId: "seed-3",
    authorName: "Jordan M.",
    content: "Parts for the outboard motor have arrived. Starting tomorrow.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let nextId = mockStore.length + 1;

// Service interface — replace with API calls when backend is ready
const messageService = {
  getMessages: async (): Promise<Message[]> => {
    return [...mockStore].reverse();
  },
  sendMessage: async (content: string, user: User): Promise<Message> => {
    const message: Message = {
      id: String(nextId++),
      authorId: user.id,
      authorName: user.name,
      content,
      createdAt: new Date().toISOString(),
    };
    mockStore.push(message);
    return message;
  },
};

export function usePeople() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await messageService.getMessages();
      setMessages(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string, user: User) => {
    setIsSending(true);
    try {
      const msg = await messageService.sendMessage(content, user);
      setMessages((prev) => [msg, ...prev]);
    } finally {
      setIsSending(false);
    }
  }, []);

  return { messages, isLoading, isSending, loadMessages, sendMessage };
}
