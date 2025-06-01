const express = require('express');
const app = express();
app.use(express.json());

// // --- Simple Graph Model for Pathfinding ---
// // Each node has: id, name, floor, neighbors: [{ id, weight }]
// const graph = {
//   'A': { id: 'A', name: 'Library', floor: 1, neighbors: [{ id: 'B', weight: 1 }] },
//   'B': { id: 'B', name: 'Stairs 1', floor: 1, neighbors: [{ id: 'A', weight: 1 }, { id: 'C', weight: 1 }, { id: 'E', weight: 2 }] },
//   'C': { id: 'C', name: 'Canteen', floor: 1, neighbors: [{ id: 'B', weight: 1 }] },
//   'E': { id: 'E', name: 'Stairs 1 (2F)', floor: 2, neighbors: [{ id: 'B', weight: 2 }, { id: 'F', weight: 1 }] },
//   'F': { id: 'F', name: 'Lecture Hall', floor: 2, neighbors: [{ id: 'E', weight: 1 }] },
// };

// // --- A* Pathfinding Algorithm ---
// function heuristic(a, b) {
//   // Simple heuristic: floor difference + 1 (if on different floors), else 0
//   return Math.abs(graph[a].floor - graph[b].floor);
// }

// function aStar(start, goal) {
//   const openSet = new Set([start]);
//   const cameFrom = {};
//   const gScore = { [start]: 0 };
//   const fScore = { [start]: heuristic(start, goal) };

//   while (openSet.size > 0) {
//     // Get node in openSet with lowest fScore
//     let current = null;
//     let minF = Infinity;
//     for (let node of openSet) {
//       if (fScore[node] < minF) {
//         minF = fScore[node];
//         current = node;
//       }
//     }
//     if (current === goal) {
//       // Reconstruct path
//       const path = [current];
//       while (cameFrom[current]) {
//         current = cameFrom[current];
//         path.unshift(current);
//       }
//       return path;
//     }
//     openSet.delete(current);
//     for (const neighbor of graph[current].neighbors) {
//       const tentativeG = gScore[current] + neighbor.weight;
//       if (tentativeG < (gScore[neighbor.id] || Infinity)) {
//         cameFrom[neighbor.id] = current;
//         gScore[neighbor.id] = tentativeG;
//         fScore[neighbor.id] = tentativeG + heuristic(neighbor.id, goal);
//         openSet.add(neighbor.id);
//       }
//     }
//   }
//   return null; // No path found
// }

// // --- API: Get Path ---
// // POST /api/path
// // Given a start and end location, returns the best path for navigation.
// app.post('/api/path', (req, res) => {
//   const { start, end } = req.body;
//   if (!graph[start] || !graph[end]) {
//     return res.status(400).json({ error: 'Invalid start or end node' });
//   }
//   const path = aStar(start, end);
//   if (!path) {
//     return res.status(404).json({ error: 'No path found' });
//   }
//   res.json({ path, message: `Path from ${start} to ${end}` });
// });


// --- Firebase Admin SDK Setup ---
const admin = require('firebase-admin');
try {
  admin.app(); // Prevent re-initialization
} catch (e) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // For production, use a service account key JSON file:
    // credential: admin.credential.cert(require('./serviceAccountKey.json')),
  });
}

// --- API: Register User ---
// POST /api/register { email, password, displayName }
app.post('/api/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName });
    res.json({ uid: userRecord.uid, email: userRecord.email, displayName: userRecord.displayName });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- API: Login User ---
// POST /api/login { email, password }
// Note: Firebase Admin SDK cannot verify passwords. Login should be handled on the client using Firebase Auth SDK.
// This endpoint is a placeholder to explain best practice.
app.post('/api/login', (req, res) => {
  res.status(400).json({ error: 'Login should be handled on the client using Firebase Auth SDK. Send the ID token to the backend for verification.' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
