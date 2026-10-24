const imageInput = document.getElementById("image-input");
const imagePreview = document.getElementById("image-preview");
const describeButton = document.getElementById("describe-button");
const description = document.getElementById("description");
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

function convertImageToBase64(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();

    reader.onload = function () {
      const dataUrl = reader.result;

      if (typeof dataUrl !== "string") {
        reject(new Error("The selected image could not be converted."));
        return;
      }

      const base64Image = dataUrl.split(",")[1];
      resolve(base64Image);
    };

    reader.onerror = function () {
      reject(new Error("The selected image could not be read."));
    };

    reader.readAsDataURL(file);
  });
}

describeButton.addEventListener("click", async function () {
  const file = imageInput.files[0];

  if (!file) {
    description.textContent = "Please choose an image first.";
    return;
  }

  describeButton.disabled = true;
  description.textContent = "Generating description...";

  try {
    const base64Image = await convertImageToBase64(file);
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llava:7b",
        messages: [
          {
            role: "user",
            content: "Describe this image.",
            images: [base64Image]
          }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error("Ollama returned an error: " + response.status);
    }

    const result = await response.json();
    if (!result.message || typeof result.message.content !== "string") {
      throw new Error("Ollama returned an unexpected response.");
    }

    description.textContent = result.message.content;
  } catch (error) {
    description.textContent = "Could not generate a description. " + error.message;
  } finally {
    describeButton.disabled = false;
  }
});