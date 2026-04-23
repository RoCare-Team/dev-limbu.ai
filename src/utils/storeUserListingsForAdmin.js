export async function storeUserListingsForAdmin(userEmail, listings) {
    try {
        const response = await fetch("/api/admin/saveBussiness", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userEmail,
                listings,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error storing listings for admin:", error);
    }
}