import type { UserProfile } from '../contexts/AuthContext';
import './Header.css';

type HeaderProps = {
	title: string;
	userProfile?: UserProfile | null;
	onLogout?: () => void;
};

function Header({ title, userProfile, onLogout }: HeaderProps) {
	console.log('Header received userProfile:', userProfile);
	
	return (
		<header className="header">
			<div className="header-content">
				<h1>{title}</h1>
				{userProfile ? (
					<div className="user-info">
						<div className="user-details">
							<span className="user-name">{userProfile.displayName || 'New User'}</span>
							<span className={`user-role role-${userProfile.role}`}>
								{userProfile.role ? userProfile.role.toUpperCase() : 'ADMIN'}
							</span>
							{userProfile.department && (
								<span className="user-department">{userProfile.department}</span>
							)}
						</div>
						{onLogout && (
							<button className="logout-btn" onClick={onLogout}>
								Logout
							</button>
						)}
					</div>
				) : (
					<div className="user-info">
						<div className="user-details">
							<span className="user-name">Loading...</span>
							<span className="user-role">LOADING...</span>
						</div>
						{onLogout && (
							<button className="logout-btn" onClick={onLogout}>
								Logout
							</button>
						)}
					</div>
				)}
			</div>
		</header>
	);
};

export default Header;