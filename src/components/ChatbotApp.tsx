import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Brain, Trash2, RefreshCw, X, BookOpen, MessageSquare, Settings, HelpCircle } from 'lucide-react';

interface Message {
    id: number;
    sender: 'bot' | 'user';
    text: string;
    timestamp: Date;
}

interface LearningData {
    patterns: string[];
    responses: string[];
    context: Record<string, string>;
}

interface UserProfile {
    name: string;
    avatar: string;
}

const DEFAULT_PROFILE = "https://zermoser.github.io/mos_mini_ai_chat/images/user.png";

const ChatbotApp: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            sender: 'bot',
            text: 'สวัสดีครับ! ผมคือแชตบอทที่เรียนรู้ได้ด้วยตัวเอง 😊 คุณสามารถสอนผมได้โดยพิมพ์ "สอน: [คำถามของคุณ] > [คำตอบที่ต้องการ]"',
            timestamp: new Date()
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [learningData, setLearningData] = useState<LearningData>({
        patterns: [],
        responses: [],
        context: {}
    });
    const [showLearningPanel, setShowLearningPanel] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile>({
        name: 'ผู้ใช้งาน',
        avatar: DEFAULT_PROFILE
    });
    const [botProfile, setBotProfile] = useState({
        name: 'AI Assistant',
        avatar: 'https://zermoser.github.io/mos_mini_ai_chat/images/ai.png'
    });
    const [showSettings, setShowSettings] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // โหลดข้อมูลการเรียนรู้จาก Local Storage เมื่อเริ่มต้น
    useEffect(() => {
        const savedData = localStorage.getItem('chatbot_learning_data');
        if (savedData) {
            setLearningData(JSON.parse(savedData));
        }

        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile));
        }
    }, []);

    // บันทึกข้อมูลการเรียนรู้เมื่อมีการเปลี่ยนแปลง
    useEffect(() => {
        localStorage.setItem('chatbot_learning_data', JSON.stringify(learningData));
        localStorage.setItem('user_profile', JSON.stringify(userProfile));
    }, [learningData, userProfile]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // ฟังก์ชันสำหรับการค้นหาคำตอบที่ตรงกับรูปแบบที่เรียนรู้
    const findLearnedResponse = useCallback((userMessage: string): string | null => {
        const lowerMsg = userMessage.toLowerCase();

        // ตรวจสอบว่ามีรูปแบบที่ตรงกับข้อความผู้ใช้หรือไม่
        for (let i = 0; i < learningData.patterns.length; i++) {
            const pattern = learningData.patterns[i].toLowerCase();

            // ตรวจสอบด้วยรูปแบบตรง
            if (lowerMsg.includes(pattern)) {
                return learningData.responses[i];
            }

            // ตรวจสอบด้วยรูปแบบคำสั่ง
            if (pattern.startsWith('$')) {
                const commandPattern = pattern.slice(1);
                if (new RegExp(commandPattern, 'i').test(lowerMsg)) {
                    return learningData.responses[i];
                }
            }
        }

        return null;
    }, [learningData]);

    // ฟังก์ชันสำหรับประมวลผลคำสั่งสอน
    const processTeachCommand = useCallback((userMessage: string): string | null => {
        const teachPattern = /สอน[:：]\s*(.+?)\s*>\s*(.+)/i;
        const match = userMessage.match(teachPattern);

        if (match) {
            const pattern = match[1].trim();
            const response = match[2].trim();

            // เพิ่มการเรียนรู้ใหม่
            setLearningData(prev => ({
                patterns: [...prev.patterns, pattern],
                responses: [...prev.responses, response],
                context: { ...prev.context }
            }));

            return `เข้าใจแล้วครับ! ตอนนี้ผมรู้ว่าเมื่อคุณพูดว่า "${pattern}" ผมจะตอบว่า "${response}"`;
        }

        return null;
    }, []);

    // ฟังก์ชันสำหรับประมวลผลคำสั่งลบการเรียนรู้
    const processForgetCommand = useCallback((userMessage: string): string | null => {
        const forgetPattern = /ลบ[:：]\s*(.+)/i;
        const match = userMessage.match(forgetPattern);

        if (match) {
            const patternToForget = match[1].trim().toLowerCase();
            let found = false;

            // กรองลบการเรียนรู้ที่ตรงกับรูปแบบ
            const newPatterns = learningData.patterns.filter((pattern, index) => {
                if (pattern.toLowerCase().includes(patternToForget)) {
                    found = true;
                    // ลบ response ที่ตรงกันด้วย
                    learningData.responses.splice(index, 1);
                    return false;
                }
                return true;
            });

            if (found) {
                setLearningData(prev => ({
                    patterns: newPatterns,
                    responses: [...prev.responses].slice(0, newPatterns.length),
                    context: { ...prev.context }
                }));
                return `ลบความรู้เกี่ยวกับ "${patternToForget}" เรียบร้อยแล้วครับ!`;
            }
        }

        return null;
    }, [learningData]);

    // ฟังก์ชันสำหรับประมวลผลคำสั่งจัดการข้อมูลการเรียนรู้
    const processLearningCommands = useCallback((userMessage: string): string | null => {
        const lowerMsg = userMessage.toLowerCase();

        if (lowerMsg.includes('ลบทั้งหมด') || lowerMsg.includes('รีเซ็ต')) {
            setLearningData({
                patterns: [],
                responses: [],
                context: {}
            });
            return 'ลบความรู้ทั้งหมดเรียบร้อยแล้วครับ!';
        }

        if (lowerMsg.includes('แสดงการเรียนรู้') || lowerMsg.includes('ความรู้')) {
            setShowLearningPanel(true);
            return 'เปิดแผงการเรียนรู้แล้วครับ!';
        }

        return null;
    }, []);

    // ฟังก์ชันสร้างคำตอบแบบสุ่มที่กระตุ้นให้สอน AI
    const generateRandomResponse = useCallback(() => {
        const randomReplies = [
            "ผมยังไม่รู้จักเรื่องนี้เลยครับ ช่วยสอนผมหน่อยได้ไหม? โดยใช้คำสั่ง: สอน: [คำถาม] > [คำตอบ]",
            "เรื่องนี้ผมยังไม่ค่อยเข้าใจนักครับ คุณช่วยสอนผมได้ไหม?",
            "ผมอยากเรียนรู้เรื่องนี้มากขึ้นครับ! ช่วยสอนผมโดยใช้คำสั่ง: สอน: [หัวข้อ] > [ข้อมูล]",
            "น่าสนใจมากครับ! ผมอยากให้คุณสอนเรื่องนี้ให้ผมหน่อย โดยพิมพ์: สอน: [คำถาม] > [คำตอบที่ต้องการ]",
            "ผมยังใหม่กับเรื่องนี้อยู่ครับ คุณช่วยสอนผมได้ไหม?",
            "เรื่องนี้ผมยังไม่มีข้อมูลครับ ช่วยสอนผมโดยใช้คำสั่งการสอน",
            "ว้าว! เรื่องนี้ผมยังไม่รู้จักเลย ช่วยสอนผมหน่อยสิครับ",
            "ผมอยากให้คุณเป็นครูสอนผมเรื่องนี้ครับ! ใช้คำสั่ง: สอน: [หัวข้อ] > [คำอธิบาย]",
            "นี่เป็นโอกาสที่ดีที่คุณจะสอนผมใหม่ๆ ครับ!",
            "ผมพร้อมเรียนรู้ครับ! ช่วยสอนเรื่องนี้ให้ผมหน่อย"
        ];

        return randomReplies[Math.floor(Math.random() * randomReplies.length)];
    }, []);

    const generateBotResponse = useCallback((userMessage: string) => {
        // ตรวจสอบคำสั่งสอน
        const teachResponse = processTeachCommand(userMessage);
        if (teachResponse) return teachResponse;

        // ตรวจสอบคำสั่งลบ
        const forgetResponse = processForgetCommand(userMessage);
        if (forgetResponse) return forgetResponse;

        // ตรวจสอบคำสั่งจัดการการเรียนรู้
        const learningCommandResponse = processLearningCommands(userMessage);
        if (learningCommandResponse) return learningCommandResponse;

        // ตรวจสอบคำตอบที่เรียนรู้มา
        const learnedResponse = findLearnedResponse(userMessage);
        if (learnedResponse) return learnedResponse;

        // ตรวจสอบคำตอบมาตรฐาน
        const lowerMsg = userMessage.toLowerCase();

        if (lowerMsg.includes("สวัสดี") || lowerMsg.includes("หวัดดี") || lowerMsg.includes("hello")) {
            return `สวัสดีครับ ${userProfile.name}! ผมคือแชตบอทที่เรียนรู้ได้ด้วยตัวเอง 😊 คุณสามารถสอนผมได้โดยพิมพ์ "สอน: [คำถามของคุณ] > [คำตอบที่ต้องการ]"`;
        } else if (lowerMsg.includes("อาหาร") || lowerMsg.includes("กิน") || lowerMsg.includes("หิว")) {
            return "หิวแล้วเหรอครับ? วันนี้ลองเมนูง่ายๆ อย่างข้าวผัดกะเพราดูไหม หรือจะเป็นราเมนร้อนๆ ก็เข้าท่า 🍜 ถ้าอยากให้แนะนำเพิ่มเติมก็บอกได้นะครับ";
        } else if (lowerMsg.includes("อากาศ") || lowerMsg.includes("สภาพอากาศ") || lowerMsg.includes("ฝน") || lowerMsg.includes("แดด")) {
            return "วันนี้อากาศน่าจะดีนะครับ ถ้าแดดออกก็น่าออกไปเดินเล่น ถ้าฝนตกก็อย่าลืมพกร่มด้วยนะ ☔ แล้วแถวบ้านคุณอากาศเป็นยังไงบ้างครับ?";
        } else if (lowerMsg.includes("เศร้า") || lowerMsg.includes("เหงา") || lowerMsg.includes("เครียด") || lowerMsg.includes("เหนื่อย")) {
            return "ผมเข้าใจความรู้สึกนั้นดีเลยครับ บางวันเราก็มีเรื่องหนักใจ แต่ไม่เป็นไรนะครับ ลองพักหายใจลึกๆ แล้วค่อยๆ เล่าให้ผมฟังได้นะ ผมอยู่ตรงนี้เพื่อคุณเสมอ 💖";
        } else if (lowerMsg.includes("ขำ") || lowerMsg.includes("เล่าเรื่องตลก")) {
            return "งั้นฟังมุกนี้หน่อยไหมครับ: ทำไมนกไม่ใช้เฟซบุ๊ก? ...เพราะมันใช้ 'ทวีต' ไงล่ะครับ! 🐦 ฮ่าๆ 😄";
        } else if (lowerMsg.includes("เวลา") || lowerMsg.includes("ตอนนี้กี่โมง")) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            return `ตอนนี้เวลาประมาณ ${timeString} ครับ 🕒 อย่าลืมพักสายตาบ้างนะครับ`;
        } else if (lowerMsg.includes("คุณคือใคร") || lowerMsg.includes("แนะนำตัว") || lowerMsg.includes("ชื่ออะไร")) {
            return `ผมคือแชตบอทผู้เป็นมิตร ที่สร้างขึ้นมาเพื่อคุยกับคุณครับ ${userProfile.name} 😊 ไม่ว่าจะเหงา มีคำถาม หรืออยากระบาย ผมอยู่ตรงนี้เสมอ`;
        } else if (lowerMsg.includes("ช่วย") || lowerMsg.includes("ขอคำแนะนำ") || lowerMsg.includes("ปรึกษา")) {
            return "แน่นอนครับ! ผมยินดีช่วยเสมอ ลองบอกมาได้เลยว่าคุณอยากปรึกษาเรื่องอะไร หรือมีอะไรที่ผมพอช่วยได้บ้าง 🙏";
        } else {
            return generateRandomResponse();
        }
    }, [findLearnedResponse, generateRandomResponse, processForgetCommand, processLearningCommands, processTeachCommand, userProfile.name]);

    const handleSendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            sender: 'user',
            text: text.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate bot thinking time
        setTimeout(() => {
            const botResponse: Message = {
                id: Date.now() + 1,
                sender: 'bot',
                text: generateBotResponse(text),
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 800 + Math.random() * 1200);
    }, [generateBotResponse]);

    const formatTime = useCallback((date: Date) => {
        return date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const resetLearningData = useCallback(() => {
        setLearningData({
            patterns: [],
            responses: [],
            context: {}
        });

        const botResponse: Message = {
            id: Date.now() + 1,
            sender: 'bot',
            text: 'ลบความรู้ทั้งหมดเรียบร้อยแล้วครับ! ตอนนี้ผมเหมือนเด็กแรกเกิดเลย 😊',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, botResponse]);
    }, []);

    const handleProfileUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
        return (
            <div className={`flex items-end space-x-2 transition-all duration-300 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.sender === 'bot' && (
                    <div className="flex-shrink-0">
                        <img
                            src={botProfile.avatar}
                            alt="Bot"
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                        />
                    </div>
                )}

                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm transition-all duration-300 ${message.sender === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                    }`}>
                    <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.text }} />
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                    </p>
                </div>

                {message.sender === 'user' && (
                    <div className="flex-shrink-0">
                        <img
                            src={userProfile.avatar}
                            alt="User"
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                        />
                    </div>
                )}
            </div>
        );
    };

    const LearningPanel = () => (
        <div className="absolute top-0 left-0 w-full h-full bg-white z-10 p-4 overflow-y-auto animate-slideIn">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <BookOpen className="mr-2 text-indigo-600" size={20} />
                    ระบบการเรียนรู้
                </h2>
                <button
                    onClick={() => setShowLearningPanel(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X size={20} className="text-gray-600" />
                </button>
            </div>

            <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <h3 className="font-semibold text-indigo-800 mb-3 flex items-center">
                    <RefreshCw className="mr-2" size={16} />
                    วิธีสอน AI
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                    คุณสามารถสอน AI ได้โดยพิมพ์คำสั่งในรูปแบบ:
                </p>
                <div className="bg-gray-800 text-indigo-300 p-3 rounded-lg text-sm font-mono mb-3">
                    สอน: [คำถามหรือหัวข้อ] &gt; [คำตอบที่ต้องการ]
                </div>
                <p className="text-sm text-gray-700 mb-2">
                    ตัวอย่าง:
                </p>
                <div className="bg-white p-3 rounded-lg text-sm mb-3 border border-indigo-200 shadow-sm">
                    <span className="font-semibold text-indigo-700">สอน:</span> แนะนำร้านอาหารไทย &gt; ร้านส้มตำคุณมอสอยู่ใกล้บริษัทนะครับ อร่อยมาก!
                </div>
                <div className="bg-white p-3 rounded-lg text-sm border border-indigo-200 shadow-sm">
                    <span className="font-semibold text-indigo-700">สอน:</span> สวัสดี &gt; สวัสดีครับ! วันนี้เป็นยังไงบ้าง?
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">ความรู้ทั้งหมด ({learningData.patterns.length})</h3>
                    <button
                        onClick={resetLearningData}
                        className="text-sm bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full flex items-center hover:opacity-90 transition-opacity shadow-md"
                    >
                        <Trash2 size={16} className="mr-1" />
                        ลบทั้งหมด
                    </button>
                </div>

                {learningData.patterns.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Brain className="mx-auto mb-3 text-gray-300" size={32} />
                        <p className="text-gray-500">ยังไม่มีข้อมูลการเรียนรู้</p>
                        <p className="text-sm mt-2 text-gray-400">เริ่มสอน AI โดยพิมพ์คำสั่ง "สอน: [คำถาม] `{'>'}` [คำตอบ]"</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {learningData.patterns.map((pattern, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="font-semibold text-indigo-600 mb-1">{pattern}</div>
                                <div className="text-gray-700 bg-indigo-50 p-2 rounded-lg">{learningData.responses[index]}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="text-xs text-gray-500 text-center p-4 bg-gray-50 rounded-xl">
                <p>ข้อมูลการเรียนรู้ทั้งหมดถูกเก็บไว้ในเบราว์เซอร์ของคุณ และไม่ส่งไปที่เซิร์ฟเวอร์ใดๆ</p>
                <p className="mt-1">การปิดเบราว์เซอร์หรือลบข้อมูลจะทำให้การเรียนรู้หายไป</p>
            </div>
        </div>
    );

    const SettingsPanel = () => (
        <div className="absolute top-0 left-0 w-full h-full bg-white z-10 p-4 overflow-y-auto animate-slideIn">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Settings className="mr-2 text-indigo-600" size={20} />
                    การตั้งค่า
                </h2>
                <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X size={20} className="text-gray-600" />
                </button>
            </div>

            <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">ข้อมูลส่วนตัว</h3>

                <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-3">
                        <img
                            src={userProfile.avatar}
                            alt="User"
                            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                        />
                        <button
                            className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-md"
                            onClick={() => {
                                const newAvatar = prompt('กรอก URL รูปภาพโปรไฟล์', userProfile.avatar);
                                if (newAvatar) {
                                    setUserProfile(prev => ({ ...prev, avatar: newAvatar }));
                                }
                            }}
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    <div className="w-full max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อของคุณ</label>
                        <input
                            type="text"
                            name="name"
                            value={userProfile.name}
                            onChange={handleProfileUpdate}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">ข้อมูลแชตบอท</h3>

                <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-3">
                        <img
                            src={botProfile.avatar}
                            alt="Bot"
                            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                        />
                        <button
                            className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-md"
                            onClick={() => {
                                const newAvatar = prompt('กรอก URL รูปภาพโปรไฟล์บอท', botProfile.avatar);
                                if (newAvatar) {
                                    setBotProfile(prev => ({ ...prev, avatar: newAvatar }));
                                }
                            }}
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    <div className="w-full max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบอท</label>
                        <input
                            type="text"
                            value={botProfile.name}
                            onChange={(e) => setBotProfile(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            <div className="text-xs text-gray-500 text-center p-4 bg-gray-50 rounded-xl">
                <p>ข้อมูลทั้งหมดถูกเก็บไว้ในเบราว์เซอร์ของคุณ และไม่ส่งไปที่เซิร์ฟเวอร์ใดๆ</p>
            </div>
        </div>
    );

    const HelpPanel = () => (
        <div className="absolute top-0 left-0 w-full h-full bg-white z-10 p-4 overflow-y-auto animate-slideIn">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <HelpCircle className="mr-2 text-indigo-600" size={20} />
                    คู่มือการใช้งาน
                </h2>
                <button
                    onClick={() => setShowHelp(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X size={20} className="text-gray-600" />
                </button>
            </div>

            <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <MessageSquare className="mr-2 text-indigo-500" size={18} />
                    การสนทนากับ AI
                </h3>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                    <p className="text-sm text-gray-700">
                        คุณสามารถสนทนากับ AI ได้เหมือนคุยกับเพื่อนคนหนึ่ง เพียงพิมพ์ข้อความของคุณในช่องด้านล่างและกดส่ง
                    </p>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <BookOpen className="mr-2 text-indigo-500" size={18} />
                    การสอน AI
                </h3>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                    <p className="text-sm text-gray-700 mb-2">
                        คุณสามารถสอน AI ให้รู้จักคำถามและคำตอบใหม่ๆ โดยใช้คำสั่ง:
                    </p>
                    <div className="bg-gray-800 text-indigo-300 p-3 rounded-lg text-sm font-mono mb-2">
                        สอน: [คำถามหรือหัวข้อ] &gt; [คำตอบที่ต้องการ]
                    </div>
                    <p className="text-sm text-gray-700">
                        ตัวอย่าง: <span className="font-mono bg-white p-1 rounded">สอน: วันเกิดใคร &gt; ผมไม่มีวันเกิดนะครับเพราะผมเป็น AI</span>
                    </p>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Trash2 className="mr-2 text-indigo-500" size={18} />
                    การจัดการความรู้
                </h3>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <p className="text-sm text-gray-700 mb-2">
                        คุณสามารถดู, แก้ไข หรือลบความรู้ทั้งหมดได้ในแผงการเรียนรู้
                    </p>
                    <p className="text-sm text-gray-700">
                        ใช้คำสั่ง: <span className="font-mono bg-white p-1 rounded">ลบ: [คำถามที่ต้องการลบ]</span> เพื่อลบความรู้เฉพาะเรื่อง
                    </p>
                </div>
            </div>

            <div className="text-xs text-gray-500 text-center p-4 bg-gray-50 rounded-xl">
                <p>แชตบอทนี้ทำงานทั้งหมดในเบราว์เซอร์ของคุณโดยไม่ต้องเชื่อมต่ออินเทอร์เน็ต</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-md mx-auto h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50 relative font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 flex items-center space-x-3 shadow-lg">
                <div className="relative flex-shrink-0">
                    <img
                        src={botProfile.avatar}
                        alt="Bot"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="font-bold text-lg truncate">{botProfile.name}</h1>
                    <p className="text-xs opacity-80 flex items-center truncate">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                        ออนไลน์ - เรียนรู้ได้ด้วยตัวเอง
                    </p>
                </div>
                <div className="flex space-x-1">
                    <button
                        onClick={() => setShowHelp(true)}
                        className="p-2 rounded-full hover:bg-indigo-500 transition-colors"
                        title="ความช่วยเหลือ"
                    >
                        <HelpCircle size={20} className="text-white" />
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 rounded-full hover:bg-indigo-500 transition-colors"
                        title="การตั้งค่า"
                    >
                        <Settings size={20} className="text-white" />
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-indigo-50">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex items-end space-x-2 justify-start animate-pulse">
                        <div className="flex-shrink-0">
                            <img
                                src={botProfile.avatar}
                                alt="Bot"
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                            />
                        </div>
                        <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Learning Panel */}
            {showLearningPanel && <LearningPanel />}

            {/* Settings Panel */}
            {showSettings && <SettingsPanel />}

            {/* Help Panel */}
            {showHelp && <HelpPanel />}

            {/* Input Section */}
            <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendMessage(input);
                            }
                        }}
                        placeholder="พิมพ์ข้อความหรือคำสั่งสอน AI..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-inner"
                        disabled={isTyping}
                    />
                    <button
                        onClick={() => handleSendMessage(input)}
                        disabled={!input.trim() || isTyping}
                        className="p-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 shadow-lg flex-shrink-0"
                    >
                        <Send size={20} />
                    </button>
                </div>

                <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full">
                            {learningData.patterns.length} ความรู้
                        </span>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowLearningPanel(true)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 px-3 py-1 rounded-full"
                        >
                            <BookOpen size={14} className="mr-1" /> การเรียนรู้
                        </button>
                        <button
                            onClick={() => setShowHelp(true)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 px-3 py-1 rounded-full"
                        >
                            <HelpCircle size={14} className="mr-1" /> ช่วยเหลือ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatbotApp;