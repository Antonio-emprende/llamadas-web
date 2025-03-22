const socket = io("https://patch-supreme-laugh.glitch.me");

let localStream;
let remoteStream;
let peerConnection;

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

socket.on("connect", () => {
  console.log("✅ Conectado al servidor:", socket.id);
  socket.emit("join", "sala-familiar");
});

socket.on("user-connected", () => {
  iniciarLlamada(true);
});

socket.on("offer", async (data) => {
  await iniciarLlamada(false);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", { room: "sala-familiar", answer });
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
  const localVideo = document.getElementById("localVideo");
  const remoteVideo = document.getElementById("remoteVideo");

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  peerConnection = new RTCPeerConnection(config);

  // Agregar pistas locales
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // Recibir video remoto
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  peerConnection.ontrack = (event) => {
    console.log("🎥 Recibiendo track remoto...");
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", { room: "sala-familiar", candidate: event.candidate });
    }
  };

  if (esIniciador) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { room: "sala-familiar", offer });
  }
}
