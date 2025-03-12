// Fetch all posts from the backend
// async function fetchPosts() {

//     const response = await fetch("http://localhost:3000/blogs");
//     const posts = await response.json();

//     console.log("Fetched Posts:", posts);

//     const blogTableBody = document.getElementById("blogTableBody");
//     blogTableBody.innerHTML = "";

//     posts.forEach(post => {
//         const row = document.createElement("tr");
//         row.innerHTML = `
//             <td>${post.postId}</td>
//             <td>${post.title}</td>
//             <td>${post.content}</td>
//             <td>
//                 <button onclick="window.location.href='viewPost.html?postId=${post.postId}'">
//                     <i class="fa fa-search"></i> View
//                 </button>
//                 <button onclick="deletePost(${post.postId})">
//                     Delete
//                 </button>
//             </td>
//         `;
//         blogTableBody.appendChild(row);
//     });
// }

let currentPage = 1;
let totalPages = 1;

async function fetchPosts(page = 1) {
    const response = await fetch(`http://ec2-43-204-229-196.ap-south-1.compute.amazonaws.com:3000/blogs?page=${page}&limit=5`);
    const data = await response.json();

    console.log("Fetched Posts:", data);

    const blogTableBody = document.getElementById("blogTableBody");
    blogTableBody.innerHTML = "";

    data.posts.forEach(post => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${post.postId}</td>
            <td>${post.title}</td>
            <td>${post.content}</td>
            <td>
                <button onclick="window.location.href='viewPost.html?postId=${post.postId}'">
                    <i class="fa fa-search"></i> View
                </button>
                <button onclick="deletePost(${post.postId})">
                    Delete
                </button>
            </td>
        `;
        blogTableBody.appendChild(row);
    });

    currentPage = data.currentPage;
    totalPages = data.totalPages;

    updatePaginationControls();
}

// Function to update pagination controls
function updatePaginationControls() {
    const paginationDiv = document.getElementById("pagination");
    paginationDiv.innerHTML = `
        <button onclick="prevPage()" ${currentPage === 1 ? "disabled" : ""}>Prev</button>
        Page ${currentPage} of ${totalPages}
        <button onclick="nextPage()" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
    `;
}

// Navigate to the previous page
function prevPage() {
    if (currentPage > 1) {
        fetchPosts(currentPage - 1);
    }
}

// Navigate to the next page
function nextPage() {
    if (currentPage < totalPages) {
        fetchPosts(currentPage + 1);
    }
}

fetchPosts();


// Add a new post    
async function addPost() {

    let titleInput = document.getElementById("title");
    let contentInput = document.getElementById("content");

    let title = titleInput.value;
    let content = contentInput.value;

    if (!title || !content) {
        alert("Title and Content cannot be empty.");
        return;
    }
    if (title.length > 10) {
        alert("Title is too long");
        return;
    }
    if (title.length < 5) {
        alert("Title is too short");
        return;
    }
    if (content.length < 15) {
        alert("Content is too short");
        return;
    }


    let body = JSON.stringify({ title, content });

    const response = await fetch("http://ec2-43-204-229-196.ap-south-1.compute.amazonaws.com:3000/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body
    });

    const newPost = await response.json();
    console.log("Server Response:", newPost); // Debug server response

    // Check if server returned correct structure
    if (!newPost || !newPost.postId || !newPost.title || !newPost.content) {
        alert("Error: Server response is invalid.");
        return;
    }

    // Append the new post to the table
    const blogTableBody = document.getElementById("blogTableBody");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${newPost.postId}</td>
        <td>${newPost.title}</td>
        <td>${newPost.content}</td>
        <td>
            <button onclick="viewPost(${newPost.postId})">
                <i class="fa fa-search"></i>View
            </button>
            <button onclick="deletePost(${newPost.postId})">
                Delete
            </button>
        </td>
    `;
    blogTableBody.appendChild(row);

    // Clear input fields
    titleInput.value = "";
    contentInput.value = "";

    fetchPosts();

}

// Delete a post
async function deletePost(postId) {

    await fetch(`http://ec2-43-204-229-196.ap-south-1.compute.amazonaws.com:3000/blog/${postId}`, { method: "DELETE" });
    fetchPosts();
}


