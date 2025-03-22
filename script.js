// Conexión con el servidor de señalización en Glitch
const socket = io("https://patch-supreme-laugh.glitch.me");

let localStream;
let peerConnection;
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

socket.on("connect", () => {
  console.log("🔌 Conectado al servidor de señalización:", socket.id);
  socket.emit("join", "sala-demo");
});

socket.on("user-connected", async (socketId) => {
  console.log("👤 Otro usuario conectado:", socketId);
  iniciarLlamada(true); // true = iniciador de la llamada
});

socket.on("offer", async (data) => {
  await iniciarLlamada(false);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", { room: "sala-demo", answer });
});

socket.on("answer", async (data) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on("candidate", (data) => {
  if (peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

function llamar(persona) {
  document.getElementById('estadoLlamada').textContent = `Llamando a ${persona}...`;

  setTimeout(() => {
    document.getElementById('estadoLlamada').textContent = `${persona} ha contestado la llamada.`;
    iniciarLlamada(true);
  }, 2000);
}

async function iniciarLlamada(esIniciador) {
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  peerConnection = new RTCPeerConnection(configuration);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // 🎯 Mostrar el video remoto
  peerConnection.ontrack = event => {
    console.log("🎥 Recibiendo video remoto");
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", { room: "sala-demo", candidate: event.candidate });
    }
  };

  if (esIniciador) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { room: "sala-demo", offer });
  }
}
