import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";

function Users({data, onLogout}) {
    const [users, setUsers] = useState([])

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            const fetchUsers = async () => {
                try {
                    const response = await fetch('http://localhost:4040/api/manage/users', {
                        method: 'GET',
                        headers: {
                            'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const res = await response.json();
                        setUsers(res.data);
                    }
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            };

            fetchUsers();
        }
    }, []);

    return (
        <>
            <div className="d-flex flex-column flex-lg-row min-vh-100 bg-light">
                <Navbar data={data} onLogout={onLogout} />
                <div>
                    <h3>Users list</h3>
                    <ul>
                        {
                            users.length > 0 ?
                                users.map((u, index) => (
                                    <li key={index}>{index + 1}. {u.nickname} - {u.email}</li>
                                ))
                                : <p>Table is Empty</p>
                        }
                    </ul>
                </div>
            </div>
        </>
    )
}
export default Users;
