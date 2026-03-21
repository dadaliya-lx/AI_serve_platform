from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False, index=True)
    password = db.Column(db.String(200), nullable=False)
    avatar = db.Column(db.String(500), default='images/Avatar/default.jpg')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    repairs = db.relationship('Repair', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'avatar': self.avatar,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Repair(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    repair_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    facility_type = db.Column(db.String(50), nullable=False, index=True)
    damage_type = db.Column(db.String(50), nullable=False, index=True)
    location = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image = db.Column(db.String(500))
    status = db.Column(db.String(20), default='pending', index=True)
    progress = db.Column(db.Integer, default=0)
    admin_note = db.Column(db.Text)
    submit_time = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    update_time = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'repair_id': self.repair_id,
            'user_id': self.user_id,
            'facility_type': self.facility_type,
            'damage_type': self.damage_type,
            'location': self.location,
            'description': self.description,
            'image': self.image,
            'status': self.status,
            'progress': self.progress,
            'admin_note': self.admin_note,
            'submit_time': self.submit_time.isoformat() if self.submit_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None
        }

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False, index=True)  # repair, system, etc.
    related_id = db.Column(db.String(50), index=True)  # repair_id or other related ID
    read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'type': self.type,
            'related_id': self.related_id,
            'read': self.read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }