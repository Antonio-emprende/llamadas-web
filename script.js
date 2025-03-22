function llamar(persona) {
  document.getElementById('estadoLlamada').textContent = `Llamando a ${persona}...`;

  // Simulación de llamada
  setTimeout(() => {
    document.getElementById('estadoLlamada').textContent = `${persona} ha contestado la llamada.`;

    // Aquí es donde luego iría el WebRTC para conectar audio/video
    iniciarLlamada();

  }, 2000);
}

function iniciarLlamada() {
  const localVideo = document.getElementById('localVideo');

  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localVideo.srcObject = stream;
    })
    .catch(err => {
      alert('Error al acceder a la cámara o micrófono: ' + err);
    });
}