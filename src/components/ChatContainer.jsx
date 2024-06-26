import React, { useState, useEffect, useRef } from 'react'

import styled from 'styled-components'
import Logout from './Logout'
import ChatInput from './ChatInput'
import axios from 'axios'
import { getAllMessagesRoute, sendMessageRoute } from '../utils/APIRoutes'
import { v4 as uuidv4 } from 'uuid'

export default function ChatContainer({ currentChat, currentUser, socket }) {
    const [messages, setMessages] = useState([])
    const [arrivalMessage, setArivalMessage] = useState(null)
    const scrollRef = useRef()
    async function messageGetting() {
        try {
            if (currentChat) {
                const response = await axios.post(getAllMessagesRoute, {
                    from: currentUser._id,
                    to: currentChat._id,
                })
                setMessages(response.data)
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    useEffect(() => {
        messageGetting()
    }, [currentChat])

    const handleSendMsg = async (msg) => {
        await axios.post(sendMessageRoute, {
            from: currentUser._id,
            to: currentChat._id,
            message: msg,
        })
        socket.current.emit('send-msg', {
            to: currentChat._id,
            from: currentUser._id,
            message: msg,
        })
        const msgs = [...messages]
        msgs.push({ fromSelf: true, message: msg })
        setMessages(msgs)
    }

    useEffect(() => {
        if (socket.current) {
            socket.current.on('msg-recieve', (msg) => {
                setArivalMessage({ fromSelf: false, message: msg })
            })
        }
    })

    useEffect(() => {
        arrivalMessage && setMessages((prev) => [...prev, arrivalMessage])
    }, [arrivalMessage])

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behaviour: 'smooth' })
    }, [messages])
    return (
        <>
            {currentChat && (
                <Container>
                    <div className="chat-header">
                        <div className="user-details">
                            <div className="avatar">
                                <img
                                    src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
                                    alt="avatar"
                                />
                            </div>
                            <div className="username">
                                <h3>{currentChat.username}</h3>
                            </div>
                        </div>
                        <Logout />
                    </div>
                    <div className="chat-messages">
                        {messages.map((message) => {
                            return (
                                <div ref={scrollRef} key={uuidv4()}>
                                    <div
                                        className={`message ${
                                            message.fromSelf
                                                ? 'sended'
                                                : 'recieved'
                                        }`}
                                    >
                                        <div className="content">
                                            <p>{message.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <ChatInput handleSendMsg={handleSendMsg} />
                </Container>
            )}
        </>
    )
}

const Container = styled.div`
    padding-top: 1rem;
    display: grid;
    grid-template-rows: 10% 78% 12%;
    gap: 0.1rem;
    overflow: hidden;
    .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 2rem;
        .user-details {
            display: flex;
            align-items: center;
            gap: 1rem;
            .avatar {
                img {
                    height: 3rem;
                }
            }
            .username {
                h3 {
                    color: white;
                }
            }
        }
    }
    .chat-messages {
        padding: 1rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow: auto;
        &::-webkit-scrollbar {
            width: 0.2rem;
            &-thumb {
                background-color: #ffffff39;
                width: 0.1rem;
                border-radius: 1rem;
            }
        }
        .message {
            display: flex;
            align-items: center;
            .content {
                max-width: 40%;
                overflow-wrap: break-word;
                padding: 1rem;
                font-size: 1.1rem;
                border-radius: 1rem;
                color: #d1d1d1;
            }
        }
        .sended {
            justify-content: flex-end;
            .content {
                background-color: #2ea30047;
            }
        }
        .recieved {
            justify-content: flex-start;
            .content {
                background-color: #8dff4b46;
            }
        }
    }

    @media screen and (max-width: 768px) {
        min-height: 65vh;
        .chat-header,
        .chat-messages {
            padding: 1rem;
        }

        .chat-messages {
            height: 60vh;
            font-size: 0.9rem;
        }
        grid-template-rows: 10% 80% 10%;
        .user-details {
            .avatar {
                img {
                    height: 1rem;
                }
            }
            .username {
                h3 {
                    font-size: 1.5rem;
                }
            }
        }
    }
`
