export async function fetchGMBAccounts(accessToken) {
  try {
    const res = await fetch(
      "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch accounts: ${res.status} ${errText}`);
    }

    const data = await res.json();
    return data.accounts || [];
  } catch (err) {
    console.error("Fetch Accounts Error:", err);
    throw err;
  }
}