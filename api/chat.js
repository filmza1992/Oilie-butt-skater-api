const express = require('express');

const router = express.Router();


// PUT endpoint to update existing messages
router.put('/chat_rooms/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const chatData = req.body;
    
  try {
    // Check if the chat room exists
    let path = `chat_rooms/${roomId}`;
    const chatRoomRef = db.ref(path);
    const chatRoomSnapshot = await chatRoomRef.once('value');
    const existingChatRoom = chatRoomSnapshot.val();

    if (!existingChatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Update messages in the chat room
    const messagesToUpdate = existingChatRoom.messages;
    const updates = {};
    messagesToUpdate.forEach(message => {
      updates[`${path}/messages/2`] = {
        create_at: chatData.create_at,
        text: chatData.text,
        type: chatData.type,
        user_id: chatData.user_id
      };
    });

    // Perform the update
    await db.ref().update(updates);

    return res.status(200).json({ message: 'Messages updated successfully' });
  } catch (error) {
    console.error('Error updating messages:', error);
    return res.status(500).json({ error: 'Failed to update messages' });
  }finally {
    if (conn){
        conn.release();
    }
}
});
router.get('/chat_rooms/:roomId/messages/:userId', (req, res) => {
    const roomId = req.params.roomId;
    const userId = req.params.userId;
    try {
        // Set up Firebase Realtime Database listener
        const listener = db.ref(`chat_rooms/${roomId}/messages`).on('value', (snapshot) => {
            const chatRoomData = snapshot.val();
        
        if (!chatRoomData) {
          return res.status(404).json({ error: 'Chat room or messages not found' });
        }

        // Fetch users data from Firebase (assuming it's a one-time fetch for this example)
        db.ref(`chat_rooms/${roomId}/users`).once('value', (usersSnapshot) => {
          const usersData = usersSnapshot.val();
          
          // Map user data to an object for easy lookup
          const usersMap = {};
          if (usersData) {
            Object.keys(usersData).forEach(userId => {
              const userData = usersData[userId];
              usersMap[userData.user_id] = {
                user_id: userData.user_id,
                username: userData.username,
                image_url: userData.image_url
              };
            });
          }
    
          // Combine messages with user information
          const messages = chatRoomData.map(message => ({
            create_at: message.create_at,
            text: message.text,
            type: message.type,
            user_type: message.user_id === userId ? 'sender' : 'receiver',
            user: usersMap[message.user_id], // Add user data to each message
          })).sort((a, b) => new Date(a.create_at) - new Date(b.create_at));
    
          // Send updated messages to the client
          if (!res.headersSent) { // Check if headers have been sent
            res.status(200).json(messages);
          }
        });
      });
  
      // Optionally, you may want to clean up the listener on client disconnect or other events
      // For example, to remove the listener:
      // listener.off();
  
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }finally {
      if (conn){
          conn.release();
      }
  }
  });

  
  


router.get('/chat_rooms/by_user/:userId', (req, res) => {
  const userId = req.params.userId;

  // Fetch all chat rooms data from Firebase
  db.ref('chat_rooms').on('value', (snapshot) => {
    const chatRooms = snapshot.val();
    if (!chatRooms) {
      return res.status(404).json({ error: 'No chat rooms found' });
    }

    // Filter chat rooms by userId
    const userChatRooms = {};
    for (const roomId in chatRooms) {
      const room = chatRooms[roomId];
      if (room.users && room.users.some(user => user.user_id === userId)) {
        userChatRooms[roomId] = room;
      }
    }

    if (Object.keys(userChatRooms).length === 0) {
      return res.status(404).json({ error: 'No chat rooms found for this user' });
    }

    return res.status(200).json(userChatRooms);
  }, (error) => {
    console.error('Error fetching chat rooms:', error);
    return res.status(500).json({ error: 'Failed to fetch chat rooms' });
  });
});

module.exports = router;
