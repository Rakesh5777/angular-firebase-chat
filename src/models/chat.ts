export class Chat {
    id = '';
    userIds: string[] = [];
    userData: ChatUserData[] = [];
    lastMessage = '';
    lastMessageDate = new Date();
    messages: Message[] = [];

    //web only
    chatName = '';
    chatPhotoUrl: string | null = '';
    unSeenMessageCount = 0;
}

export class ChatUserData {
    displayName = '';
    photoUrl = '';
    unSeenMessageCount = 0;
    isOnline = false;
}

export class Message {
    sender = '';
    message = '';
    sentDate = new Date();
}