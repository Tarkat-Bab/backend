# Chat WebSocket API Documentation

## Overview

This document describes the real-time chat WebSocket API for frontend developers. The chat system uses Socket.IO for real-time bidirectional communication.

**WebSocket Endpoint:** `ws://your-server-url` (or `wss://` for secure connections)

**Configuration:**
- CORS: Enabled for all origins
- Max file upload size: 10MB
- Protocol: Socket.IO

---

## Connection

### Establishing Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://your-server-url', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to chat server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

---

## Enums & Types

### ConversationType
```typescript
enum ConversationType {
  CLIENT_ADMIN = 'CLIENT_ADMIN',
  TECHNICIAN_ADMIN = 'TECHNICIAN_ADMIN',
  CLIENT_TECHNICIAN = 'CLIENT_TECHNICIAN'
}
```

### MessageType
```typescript
enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
}
```

### Message Object
```typescript
interface Message {
  id: number;
  content: string;
  createdAt: string; // ISO date string
  isRead: boolean;
  imageUrl: string | null;
  type: MessageType;
  sender: {
    id: number;
    username: string;
    image?: string;
  };
  conversation: {
    id: number;
  };
}
```

### Conversation Object
```typescript
interface Conversation {
  conversationId: number;
  type: ConversationType;
  updatedAt: string; // ISO date string
  recipient: {
    id: number;
    username: string;
    image?: string;
  };
  lastMessage: string | null;
  messageDate: string | null; // ISO date string
  unreadCount: number;
  messages?: Message[]; // Only if includeMessages is true
}
```

---

## Client Events (Emit)

### 1. Get All Conversations

Retrieve all conversations for a user.

**Event:** `allConversations`

**Payload:**
```typescript
{
  userId: number;
  type?: ConversationType; // Optional: filter by conversation type for dashboard
  includeMessages?: boolean; // Optional: include messages in response (default: false)
}
```

**Example:**
```javascript
socket.emit('allConversations', {
  userId: 123,
  type: 'CLIENT_TECHNICIAN',
  includeMessages: false
}, (response) => {
  console.log('Conversations:', response);
});
```

**Response:** Array of `Conversation` objects

---

### 2. Join Conversation

Join or create a conversation with another user.

**Event:** `joinConversation`

**Payload:**
```typescript
{
  userId: number;        // Current user ID
  receiverId: number;    // Other user ID
  type?: ConversationType; // Optional: conversation type
}
```

**Example:**
```javascript
socket.emit('joinConversation', {
  userId: 123,
  receiverId: 456,
  type: 'CLIENT_TECHNICIAN'
}, (response) => {
  console.log('Joined conversation:', response);
  // response: { conversationId, messages, isNewConversation }
});
```

**Response:**
```typescript
{
  conversationId: number;
  messages: Message[];
  isNewConversation: boolean;
}
```

**Important Notes:**
- Automatically leaves any previous conversation rooms
- Marks unread messages as read
- Only one conversation can be active at a time per socket

---

### 3. Leave Conversation

Leave the current conversation room.

**Event:** `leaveConversation`

**Payload:**
```typescript
{
  conversationId: number;
  userId: number;
}
```

**Example:**
```javascript
socket.emit('leaveConversation', {
  conversationId: 789,
  userId: 123
});
```

**Best Practice:** Call this when user closes chat window or navigates away.

---

### 4. Send Message

Send a text or file message in a conversation.

**Event:** `sendMessage`

**Payload:**
```typescript
{
  conversationId: number;
  senderId: number;
  content?: string;      // Text content (optional if file is provided)
  file?: File;           // File object (optional)
  lang?: 'en' | 'ar';    // Language for notifications (optional)
}
```

**Example (Text Message):**
```javascript
socket.emit('sendMessage', {
  conversationId: 789,
  senderId: 123,
  content: 'Hello, how are you?',
  lang: 'en'
}, (response) => {
  console.log('Message sent:', response);
});
```

**Example (File Upload):**
```javascript
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

socket.emit('sendMessage', {
  conversationId: 789,
  senderId: 123,
  content: 'Check this file',
  file: file,
  lang: 'en'
}, (response) => {
  console.log('File message sent:', response);
});
```

**Response:** `Message` object

---

### 5. Typing Indicator

Notify others that user is typing.

**Event:** `typing`

**Payload:**
```typescript
{
  conversationId: number;
  userId: number;
}
```

**Example:**
```javascript
// Trigger on input change
inputElement.addEventListener('input', () => {
  socket.emit('typing', {
    conversationId: 789,
    userId: 123
  });
});
```

**Best Practice:** Debounce this event to avoid excessive emissions.

---

### 6. Mark Message as Read

Mark a specific message as read.

**Event:** `readMessage`

**Payload:**
```typescript
{
  messageId: number;
  conversationId: number;
  userId?: number;
}
```

**Example:**
```javascript
socket.emit('readMessage', {
  messageId: 1001,
  conversationId: 789,
  userId: 123
});
```

---

## Server Events (Listen)

### 1. All Conversations Update

Receive updated list of all conversations.

**Event:** `allConversations`

**Payload:** Array of `Conversation` objects

**Example:**
```javascript
socket.on('allConversations', (conversations) => {
  console.log('Conversations updated:', conversations);
  // Update UI with new conversation list
  updateConversationsList(conversations);
});
```

**Triggered When:**
- User requests conversations
- New message is sent/received
- Message is read
- User joins/leaves conversation

---

### 2. Conversation Messages

Receive all messages for a conversation (sent only to joining user).

**Event:** `conversationMessages`

**Payload:** Array of `Message` objects

**Example:**
```javascript
socket.on('conversationMessages', (messages) => {
  console.log('Conversation messages:', messages);
  // Display messages in chat window
  displayMessages(messages);
});
```

**Triggered When:**
- User joins a conversation

---

### 3. New Message

Receive a new message in real-time.

**Event:** `newMessage`

**Payload:** `Message` object

**Example:**
```javascript
socket.on('newMessage', (message) => {
  console.log('New message received:', message);
  // Append message to chat window
  appendMessage(message);
  
  // Play notification sound if not from current user
  if (message.sender.id !== currentUserId) {
    playNotificationSound();
  }
});
```

**Triggered When:**
- Any participant sends a message in the current conversation

---

### 4. User Joined

Notification that a user joined the conversation.

**Event:** `userJoined`

**Payload:**
```typescript
{
  userId: number;
  conversationId: number;
}
```

**Example:**
```javascript
socket.on('userJoined', (data) => {
  console.log(`User ${data.userId} joined conversation ${data.conversationId}`);
  // Show "User is online" indicator
  showUserOnline(data.userId);
});
```

---

### 5. User Left

Notification that a user left the conversation.

**Event:** `userLeft`

**Payload:**
```typescript
{
  userId: number;
  conversationId: number;
}
```

**Example:**
```javascript
socket.on('userLeft', (data) => {
  console.log(`User ${data.userId} left conversation ${data.conversationId}`);
  // Hide "User is online" indicator
  hideUserOnline(data.userId);
});
```

---

### 6. User Typing

Notification that a user is typing.

**Event:** `userTyping`

**Payload:** `number` (userId)

**Example:**
```javascript
socket.on('userTyping', (userId) => {
  console.log(`User ${userId} is typing...`);
  // Show typing indicator
  showTypingIndicator(userId);
  
  // Hide after 3 seconds of no typing
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    hideTypingIndicator(userId);
  }, 3000);
});
```

---

### 7. Message Read

Notification that a message was marked as read.

**Event:** `messageRead`

**Payload:**
```typescript
{
  messageId: number;
  isRead: boolean;
}
```

**Example:**
```javascript
socket.on('messageRead', (data) => {
  console.log(`Message ${data.messageId} was read`);
  // Update message UI to show read status
  updateMessageReadStatus(data.messageId, data.isRead);
});
```

---

### 8. Messages Read (Bulk)

Notification that multiple messages were marked as read.

**Event:** `messagesRead`

**Payload:**
```typescript
{
  messageIds: number[];
}
```

**Example:**
```javascript
socket.on('messagesRead', (data) => {
  console.log(`Messages read:`, data.messageIds);
  // Update multiple messages UI to show read status
  data.messageIds.forEach(id => {
    updateMessageReadStatus(id, true);
  });
});
```

---

## Complete Implementation Example

```javascript
import { io } from 'socket.io-client';

class ChatClient {
  constructor(serverUrl, userId) {
    this.socket = io(serverUrl);
    this.userId = userId;
    this.currentConversationId = null;
    
    this.setupListeners();
  }
  
  setupListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to chat');
      this.loadConversations();
    });
    
    // Conve