import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Brain, Trash2, RefreshCw, X, BookOpen } from 'lucide-react';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // โหลดข้อมูลการเรียนรู้จาก Local Storage เมื่อเริ่มต้น
    useEffect(() => {
        const savedData = localStorage.getItem('chatbot_learning_data');
        if (savedData) {
            setLearningData(JSON.parse(savedData));
        }
    }, []);

    // บันทึกข้อมูลการเรียนรู้เมื่อมีการเปลี่ยนแปลง
    useEffect(() => {
        localStorage.setItem('chatbot_learning_data', JSON.stringify(learningData));
    }, [learningData]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ฟังก์ชันสำหรับการค้นหาคำตอบที่ตรงกับรูปแบบที่เรียนรู้
    const findLearnedResponse = (userMessage: string): string | null => {
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
    };

    // ฟังก์ชันสำหรับประมวลผลคำสั่งสอน
    const processTeachCommand = (userMessage: string): string | null => {
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
    };

    // ฟังก์ชันสำหรับประมวลผลคำสั่งลบการเรียนรู้
    const processForgetCommand = (userMessage: string): string | null => {
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
    };

    // ฟังก์ชันสำหรับประมวลผลคำสั่งจัดการข้อมูลการเรียนรู้
    const processLearningCommands = (userMessage: string): string | null => {
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
    };

    // ฟังก์ชันสร้างคำตอบแบบสุ่ม
    const generateRandomResponse = () => {
        const randomReplies = [
            "ชีวิตก็เหมือนบทสนทนา... เราเลือกได้ว่าจะพูดอะไร และฟังอะไร 🎙️",
            "วันนี้คุณเป็นอย่างไรบ้างครับ?",
            "คุณรู้ไหมว่าการเรียนรู้คือกุญแจสู่ความสำเร็จ?",
            "ผมพร้อมที่จะช่วยเหลือคุณเสมอ 😊",
            "ลองเล่าเรื่องสนุกๆ ให้ผมฟังหน่อยสิครับ!",
            "คุณมีเรื่องอะไรที่อยากให้ผมช่วยเหลือไหมครับ?",
            "การเรียนรู้ใหม่ๆ ทำให้เราพัฒนาตัวเองอยู่เสมอ 📚",
            "อย่าลืมพักผ่อนบ้างนะครับ สุขภาพสำคัญที่สุด 🌿",
            "ผมคิดว่าคุณเป็นคนน่าสนใจมากเลยครับ!",
            "ถ้ามีคำถามอะไรก็ถามได้เลยนะครับ ผมยินดีช่วยเสมอ"
        ];

        return randomReplies[Math.floor(Math.random() * randomReplies.length)];
    };

    const generateBotResponse = (userMessage: string) => {
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
            return `สวัสดีครับ! ผมคือแชตบอทที่เรียนรู้ได้ด้วยตัวเอง 😊 คุณสามารถสอนผมได้โดยพิมพ์ "สอน: [คำถามของคุณ] > [คำตอบที่ต้องการ]"`;
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
            return "ผมคือแชตบอทผู้เป็นมิตร ที่สร้างขึ้นมาเพื่อคุยกับคุณครับ ไม่ว่าจะเหงา มีคำถาม หรืออยากระบาย ผมอยู่ตรงนี้เสมอ 😊";
        } else if (lowerMsg.includes("ช่วย") || lowerMsg.includes("ขอคำแนะนำ") || lowerMsg.includes("ปรึกษา")) {
            return "แน่นอนครับ! ผมยินดีช่วยเสมอ ลองบอกมาได้เลยว่าคุณอยากปรึกษาเรื่องอะไร หรือมีอะไรที่ผมพอช่วยได้บ้าง 🙏";
        } else {
            return generateRandomResponse();
        }
    };

    const handleSendMessage = async (text: string) => {
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
        }, 1000 + Math.random() * 2000);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const resetLearningData = () => {
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
    };

    return (
        <div className="max-w-md mx-auto h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 relative font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center space-x-3 shadow-md">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center">
                            <Brain size={24} className="text-white" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                    <h1 className="font-bold text-lg">AI Assistant</h1>
                    <p className="text-xs opacity-80 flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                        ออนไลน์ - เรียนรู้ได้ด้วยตัวเอง
                    </p>
                </div>
                <button
                    onClick={() => setShowLearningPanel(!showLearningPanel)}
                    className="p-2 rounded-full hover:bg-blue-500 transition-colors"
                    title="การเรียนรู้"
                >
                    <BookOpen size={20} className="text-white" />
                </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-blue-50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-end space-x-2 transition-all duration-300 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        {msg.sender === 'bot' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                                <Brain size={16} className="text-white" />
                            </div>
                        )}

                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm transition-all duration-300 ${msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                            }`}>
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text }} />
                            <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                                }`}>
                                {formatTime(msg.timestamp)}
                            </p>
                        </div>

                        {msg.sender === 'user' && (
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mb-1 shadow-md">
                                <User size={16} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex items-end space-x-2 justify-start animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                            <Brain size={16} className="text-white" />
                        </div>
                        <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Learning Panel */}
            {showLearningPanel && (
                <div className="absolute top-0 left-0 w-full h-full bg-white z-10 p-4 overflow-y-auto animate-slideIn">
                    <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <BookOpen className="mr-2 text-blue-600" size={20} />
                            ระบบการเรียนรู้
                        </h2>
                        <button
                            onClick={() => setShowLearningPanel(false)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} className="text-gray-600" />
                        </button>
                    </div>

                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                            <RefreshCw className="mr-2" size={16} />
                            วิธีสอน AI
                        </h3>
                        <p className="text-sm text-gray-700 mb-3">
                            คุณสามารถสอน AI ได้โดยพิมพ์คำสั่งในรูปแบบ:
                        </p>
                        <div className="bg-gray-800 text-blue-300 p-3 rounded-lg text-sm font-mono mb-3">
                            สอน: [คำถามหรือหัวข้อ] &gt; [คำตอบที่ต้องการ]
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                            ตัวอย่าง:
                        </p>
                        <div className="bg-white p-3 rounded-lg text-sm mb-3 border border-blue-200 shadow-sm">
                            <span className="font-semibold text-blue-700">สอน:</span> แนะนำร้านอาหารไทย &gt; ร้านส้มตำเจ๊พรอยู่ใกล้มหาวิทยาลัยนะครับ อร่อยมาก!
                        </div>
                        <div className="bg-white p-3 rounded-lg text-sm border border-blue-200 shadow-sm">
                            <span className="font-semibold text-blue-700">สอน:</span> สวัสดี &gt; สวัสดีครับ! วันนี้เป็นยังไงบ้าง?
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
                                        <div className="font-semibold text-blue-600 mb-1">{pattern}</div>
                                        <div className="text-gray-700 bg-blue-50 p-2 rounded-lg">{learningData.responses[index]}</div>
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
            )}

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
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-inner"
                        disabled={isTyping}
                    />
                    <button
                        onClick={() => handleSendMessage(input)}
                        disabled={!input.trim() || isTyping}
                        className="p-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 shadow-lg"
                    >
                        <Send size={20} />
                    </button>
                </div>

                <div className="mt-3 text-xs text-gray-600 flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full mr-2">
                            {learningData.patterns.length} ความรู้
                        </span>
                        <span className="hidden sm:inline">
                            ตัวอย่าง: <span className="font-mono bg-gray-100 px-2 py-1 rounded">สอน: วันนี้เป็นยังไงบ้าง &gt; วันนี้สบายดีครับ!</span>
                        </span>
                    </div>
                    <button
                        onClick={() => setShowLearningPanel(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                        <BookOpen size={14} className="mr-1" /> ดูการเรียนรู้
                    </button>
                </div>
            </div>

            {/* Floating button for learning panel on mobile */}
            {!showLearningPanel && (
                <button
                    onClick={() => setShowLearningPanel(true)}
                    className="fixed bottom-20 right-4 sm:hidden p-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-lg z-20"
                >
                    <BookOpen size={20} />
                </button>
            )}
        </div>
    );
};

export default ChatbotApp;