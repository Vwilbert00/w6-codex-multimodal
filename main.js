const imageInput = document.getElementById("image-input");
const secondImageInput = document.getElementById("image-input-2");
const describeButton = document.getElementById("describe-button");
const description = document.getElementById("description");

function setupImagePreview(input, preview) {
  let imageUrl = null;

  input.addEventListener("change", function () {
    const file = input.files[0];

    preview.textContent = "";

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
    preview.appendChild(image);
  });
}

setupImagePreview(imageInput, document.getElementById("image-preview"));
setupImagePreview(secondImageInput, document.getElementById("image-preview-2"));

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

async function getImageDescription(file) {
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

  return result.message.content;
}

describeButton.addEventListener("click", async function () {
  const firstFile = imageInput.files[0];
  const secondFile = secondImageInput.files[0];

  if (!firstFile || !secondFile) {
    description.textContent = "Please select both images before requesting descriptions.";
    return;
  }

  describeButton.disabled = true;
  description.textContent = "Generating descriptions...";

  try {
    const firstDescription = await getImageDescription(firstFile);
    const secondDescription = await getImageDescription(secondFile);

    description.textContent = "";

    const firstResult = document.createElement("p");
    const firstLabel = document.createElement("strong");
    firstLabel.textContent = "Image 1: ";
    firstResult.appendChild(firstLabel);
    firstResult.appendChild(document.createTextNode(firstDescription));
    description.appendChild(firstResult);

    const secondResult = document.createElement("p");
    const secondLabel = document.createElement("strong");
    secondLabel.textContent = "Image 2: ";
    secondResult.appendChild(secondLabel);
    secondResult.appendChild(document.createTextNode(secondDescription));
    description.appendChild(secondResult);
  } catch (error) {
    description.textContent = "Could not generate a description. " + error.message;
  } finally {
    describeButton.disabled = false;
  }
});