const imageInput = document.getElementById("image-input");
const imagePreview = document.getElementById("image-preview");
let imageUrl = null;

imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];

  imagePreview.textContent = "";

  if (imageUrl) {
    URL.revokeObjectURL(imageUrl);
    imageUrl = null;
  }

  if (!file) {
    return;
  }

  const image = document.createElement("img");
  imageUrl = URL.createObjectURL(file);
  image.src = imageUrl;
  image.alt = "Selected image preview";
  imagePreview.appendChild(image);
});