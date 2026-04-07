const { io } = require("socket.io-client");

const URL = "http://localhost:5000";
const roomId = "test_request_123";

const socketA = io(URL);
const socketB = io(URL);

socketA.on("connect", () => {
    console.log("Socket A connected:", socketA.id);
    socketA.emit("join_request_room", roomId);
    
    setTimeout(() => {
        console.log("Socket A sending message...");
        socketA.emit("send_message", {
            requestId: roomId,
            message: "Hello from A!",
            sender: { _id: "A", name: "UserA" },
            createdAt: new Date().toISOString()
        });
    }, 1000);
});

socketB.on("connect", () => {
    console.log("Socket B connected:", socketB.id);
    socketB.emit("join_request_room", roomId);
});

socketB.on("receive_message", (data) => {
    console.log("Socket B received message:", data);
    process.exit(0);
});

setTimeout(() => {
    console.log("Timeout! Socket B did not receive message.");
    process.exit(1);
}, 3000);
