export class Chat {
    id = '';
    userIds: string[] = [];
    userData: { displayName: string, photoUrl: string }[] = [];
    lastMessage = '';
    lastMessageDate = new Date();
    messages: Message[] = [];

    //web only
    chatName = '';
    chatPhotoUrl = '';
}

export class Message {
    sender = '';
    message = '';
    sentDate = new Date();
}