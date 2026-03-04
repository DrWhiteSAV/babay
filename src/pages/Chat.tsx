import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { motion } from "motion/react";
import { ArrowLeft, MessageSquare, Send, ImagePlus, X, Users, Settings, Reply } from "lucide-react";
import { generateFriendChat } from "../services/ai";
import ProfilePopup from "../components/ProfilePopup";

interface Message {
  id: string;
  sender: string;
  text: string;
  imageUrl?: string;
  replyTo?: string; // ID of the message being replied to
}

import Header from "../components/Header";

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { character, friends, groupChats, updateGroupMembers, globalBackgroundUrl, pageBackgrounds } = usePlayerStore();
    const friendName = location.state?.friendName;
  const groupId = location.state?.groupId;
  const friend = friends.find(f => f.name === friendName);
  const group = groupChats.find(g => g.id === groupId);
  const activeBgUrl = pageBackgrounds?.[location.pathname]?.url || globalBackgroundUrl;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState<string | null>(null);
  const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>(group?.members || []);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!character || (!friendName && !groupId)) {
      navigate("/friends");
    }
  }, [character, friendName, groupId, navigate]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || (!friend && !group)) return;

    const userMessage = input.trim();
    const imageToSend = selectedImage;
    const currentReplyTo = replyToMsg?.id;
    
    const newMsg: Message = { id: Date.now().toString(), sender: "user", text: userMessage, imageUrl: imageToSend || undefined, replyTo: currentReplyTo };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setSelectedImage(null);
    setReplyToMsg(null);
    setShowMentions(false);

    if (friend?.isAiEnabled) {
      setIsAiTyping(true);
      
      try {
        const recentMessages = messages.slice(-10).map(m => ({ sender: m.sender, text: m.text }));
        const responseText = await generateFriendChat(userMessage, friend.name, character, character?.style || "Обычная", recentMessages, imageToSend || undefined);
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: friend.name, text: responseText, replyTo: newMsg.id },
        ]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: friend.name, text: "Связь прервалась. Попробуй позже.", replyTo: newMsg.id },
        ]);
      } finally {
        setIsAiTyping(false);
      }
    } else if (group) {
      // Group chat logic
      const aiMembers = group.members.filter(m => friends.find(f => f.name === m)?.isAiEnabled);
      const mentionedAIs = aiMembers.filter(m => userMessage.includes(`@${m}`));
      
      // If a specific AI is mentioned, or if it's a reply to an AI's message
      let responders = mentionedAIs;
      
      if (responders.length === 0 && currentReplyTo) {
        const repliedMsg = messages.find(m => m.id === currentReplyTo);
        if (repliedMsg && aiMembers.includes(repliedMsg.sender)) {
          responders = [repliedMsg.sender];
        }
      }

      // Randomly join conversation if not mentioned (low probability)
      if (responders.length === 0 && aiMembers.length > 0 && Math.random() > 0.8) {
        responders = [aiMembers[Math.floor(Math.random() * aiMembers.length)]];
      }

      if (responders.length > 0) {
        setIsAiTyping(true);
        
        // Process responses sequentially to avoid rate limits and keep conversation natural
        const processResponses = async () => {
          for (const responder of responders) {
            try {
              const recentMessages = messages.slice(-10).map(m => ({ sender: m.sender, text: m.text }));
              const responseText = await generateFriendChat(userMessage, responder, character, character?.style || "Обычная", recentMessages, imageToSend || undefined);
              setMessages((prev) => [
                ...prev,
                { id: Date.now().toString() + responder, sender: responder, text: responseText, replyTo: newMsg.id },
              ]);
            } catch (e) {
              console.error("Group AI chat error:", e);
            }
          }
          setIsAiTyping(false);
        };
        
        processResponses();
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    if (group) {
      const lastWord = val.split(" ").pop();
      if (lastWord?.startsWith("@")) {
        setShowMentions(true);
        setMentionFilter(lastWord.slice(1).toLowerCase());
      } else {
        setShowMentions(false);
      }
    }
  };

  const insertMention = (name: string) => {
    const words = input.split(" ");
    words.pop();
    setInput([...words, `@${name} `].join(" ").trimStart());
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleUpdateMembers = () => {
    if (group) {
      updateGroupMembers(group.id, selectedFriends);
      setShowMembersModal(false);
    }
  };

  const toggleFriendSelection = (name: string) => {
    if (name === "ДанИИл") return; // Cannot remove DanIIL
    setSelectedFriends(prev => 
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  const getAvatarUrl = (sender: string) => {
    if (sender === "user") return character?.avatarUrl || "https://picsum.photos/seed/user/100/100";
    if (sender === "ДанИИл") return "https://picsum.photos/seed/danil/100/100";
    return `https://picsum.photos/seed/${sender}/100/100`;
  };

  if (!friend && !group) return null;

  const chatTitle = friend ? friend.name : group?.name;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex-1 flex flex-col bg-transparent text-neutral-200 relative overflow-hidden"
    >
      {activeBgUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none mix-blend-overlay" 
          style={{ backgroundImage: `url(${activeBgUrl})` }}
        />
      )}
      <div className="fog-container">
        <div className="fog-layer"></div>
        <div className="fog-layer-2"></div>
      </div>

      <Header 
        title={
          <div className="flex items-center gap-2">
            <MessageSquare size={20} /> 
            <span className="truncate max-w-[150px]">{chatTitle}</span>
            {group && (
              <button onClick={() => setShowMembersModal(true)} className="ml-2 p-1 bg-neutral-800 rounded-lg hover:bg-neutral-700 text-neutral-400">
                <Users size={16} />
              </button>
            )}
          </div>
        }
        backUrl="/friends"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {messages.length === 0 && (
          <p className="text-center text-neutral-500 py-8">Начните общение в чате {chatTitle}!</p>
        )}
        {messages.map((msg, i) => {
          const isUser = msg.sender === "user";
          const repliedMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
          
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div 
                className="flex items-center gap-2 mb-1 cursor-pointer"
                onClick={() => setShowProfilePopup(isUser ? "user" : msg.sender)}
              >
                {!isUser && (
                  <img src={getAvatarUrl(msg.sender)} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-neutral-700" />
                )}
                <span className="text-xs text-neutral-500">{isUser ? character?.name : msg.sender}</span>
                {isUser && (
                  <img src={getAvatarUrl(msg.sender)} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-neutral-700" />
                )}
              </div>
              <div className="flex items-end gap-2 group/msg">
                {isUser && group && (
                  <button onClick={() => setReplyToMsg(msg)} className="opacity-0 group-hover/msg:opacity-100 p-1 text-neutral-500 hover:text-white transition-opacity">
                    <Reply size={14} />
                  </button>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${isUser ? "bg-red-900 text-white rounded-tr-sm" : "bg-neutral-800 text-neutral-200 rounded-tl-sm"}`}
                >
                  {repliedMsg && (
                    <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-white/30 text-xs text-neutral-300">
                      <span className="font-bold opacity-70 block mb-1">{repliedMsg.sender === "user" ? character?.name : repliedMsg.sender}</span>
                      <span className="line-clamp-1">{repliedMsg.text || "Фото"}</span>
                    </div>
                  )}
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="attachment" className="w-full max-w-[200px] rounded-lg mb-2 object-contain" />
                  )}
                  {msg.text && (
                    <p className="text-sm">
                      {msg.text.split(' ').map((word, idx) => {
                        if (word.startsWith('@')) {
                          return <span key={idx} className="text-blue-400 font-bold">{word} </span>;
                        }
                        return word + ' ';
                      })}
                    </p>
                  )}
                </div>
                {!isUser && group && (
                  <button onClick={() => setReplyToMsg(msg)} className="opacity-0 group-hover/msg:opacity-100 p-1 text-neutral-500 hover:text-white transition-opacity">
                    <Reply size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {isAiTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-2xl bg-neutral-800 text-neutral-400 rounded-tl-sm flex gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-neutral-900 border-t border-neutral-800 relative z-20">
        {replyToMsg && (
          <div className="mb-2 flex items-center justify-between bg-neutral-800 p-2 rounded-lg border-l-2 border-red-500">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-red-400 font-bold block">Ответ {replyToMsg.sender === "user" ? character?.name : replyToMsg.sender}</span>
              <span className="text-sm text-neutral-300 truncate block">{replyToMsg.text || "Фото"}</span>
            </div>
            <button onClick={() => setReplyToMsg(null)} className="text-neutral-500 hover:text-white p-1">
              <X size={16} />
            </button>
          </div>
        )}
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img src={selectedImage} alt="preview" className="h-20 rounded-lg border border-neutral-700" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-500"
            >
              <X size={14} />
            </button>
          </div>
        )}
        {showMentions && group && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-xl max-h-40 overflow-y-auto">
            {group.members
              .filter(m => m.toLowerCase().includes(mentionFilter))
              .map(m => (
                <button
                  key={m}
                  onClick={() => insertMention(m)}
                  className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-white text-sm flex items-center gap-2"
                >
                  <img src={getAvatarUrl(m)} alt="" className="w-6 h-6 rounded-full" />
                  {m}
                </button>
              ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors flex items-center justify-center"
          >
            <ImagePlus size={20} className="text-neutral-400" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Сообщение..."
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-900 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || isAiTyping}
            className="p-3 bg-red-700 hover:bg-red-600 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
      </div>

      {showMembersModal && group && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Участники</h2>
              <button onClick={() => setShowMembersModal(false)} className="text-neutral-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-2">
              {friends.map(friend => (
                <label key={friend.name} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${friend.name === "ДанИИл" ? 'bg-neutral-800/30 opacity-70' : 'bg-neutral-800/50 hover:bg-neutral-800'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedFriends.includes(friend.name) || friend.name === "ДанИИл"}
                    onChange={() => toggleFriendSelection(friend.name)}
                    disabled={friend.name === "ДанИИл"}
                    className="accent-red-600 w-4 h-4"
                  />
                  <img src={getAvatarUrl(friend.name)} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <span className="text-white">{friend.name}</span>
                  {friend.name === "ДанИИл" && <span className="ml-auto text-xs text-neutral-500">ИИ</span>}
                </label>
              ))}
            </div>

            <button
              onClick={handleUpdateMembers}
              className="w-full py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
            >
              Сохранить
            </button>
          </motion.div>
        </div>
      )}

      {/* Profile Popup */}
      {showProfilePopup && (
        <ProfilePopup name={showProfilePopup} onClose={() => setShowProfilePopup(null)} />
      )}
    </motion.div>
  );
}
