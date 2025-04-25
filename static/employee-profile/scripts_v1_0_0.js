function enableEdit() {
  document.getElementById('verify-section').style.display = 'block';
}

async function sendCode() {
  const phone = document.getElementById('new-number').value;
  const response = await fetch('/api/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  if (response.ok) {
    alert('Verification code sent!');
  }
}

function previewImage() {
  const input = document.getElementById('profile-upload');
  const preview = document.getElementById('preview-pic');
  const file = input.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
  }
}

async function uploadPic() {
  const input = document.getElementById('profile-upload');
  const file = input.files[0];
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload-profile-pic', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    const toast = document.getElementById('toast');
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
  }
}
