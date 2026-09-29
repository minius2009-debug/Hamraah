import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  createdAt: any;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  recipientName: string;
  recipientPhoto?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, chatId, recipientName, recipientPhoto }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const QUICK_REPLIES = ["Where are you?", "I am here", "Wait for me", "Coming now"];

  useEffect(() => {
    if (!chatId || !isOpen) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });

    return () => unsubscribe();
  }, [chatId, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    if (!user || !chatId) return;

    const messageToSend = textOverride || newMessage;
    if (!messageToSend.trim()) return;

    try {
      // Ensure chat document exists
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        const [id1, id2] = chatId.split('_');
        await setDoc(chatRef, {
          id: chatId,
          participants: [id1, id2],
          updatedAt: serverTimestamp()
        });
      }

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: messageToSend,
        createdAt: serverTimestamp()
      });

      if (!textOverride) setNewMessage('');
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] flex flex-col h-[80vh] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-teal text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 bg-slate-100">
                  {recipientPhoto ? (
                    <img src={recipientPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-teal">
                      <User size={20} />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-none">{recipientName}</h4>
                  <span className="text-[10px] opacity-80 italic">Coordination Chat</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${user && msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    user && msg.senderId === user.uid
                      ? 'bg-teal text-white rounded-tr-none'
                      : 'bg-white text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    <p>{msg.text}</p>
                    <span className={`text-[8px] block mt-1 ${user && msg.senderId === user.uid ? 'text-white/60' : 'text-slate-400'}`}>
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </span>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-xs">No messages yet. Say hello to start coordinating!</p>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSendMessage(undefined, reply)}
                  className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-teal hover:border-teal transition-colors shadow-sm"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal/20"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-10 h-10 bg-teal text-white rounded-xl flex items-center justify-center disabled:opacity-50 shadow-lg shadow-teal/10"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
