const localDb = {
    users: [{ id: 1, userName: "Network", password: "Security" }],
};

localDb.getUser = (userName, password) => {
    return localDb.users.find(
        (user) => user.userName === userName && user.password === password
    );
}

module.exports = localDb;
