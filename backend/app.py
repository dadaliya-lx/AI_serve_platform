from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import random
import string

from config import Config
from models import db, User, Repair, Admin, Notification

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
jwt = JWTManager(app)
db.init_app(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(phone=data['phone']).first():
        return jsonify({'success': False, 'message': '该手机号已注册'}), 400
    
    user = User(
        name=data['name'],
        phone=data['phone'],
        password=generate_password_hash(data['password'])
    )
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({'success': True, 'message': '注册成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': '注册失败'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter_by(phone=data['phone']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'success': False, 'message': '手机号或密码错误'}), 401
    
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'success': True,
        'token': access_token,
        'user': user.to_dict()
    })

@app.route('/api/repairs', methods=['POST'])
@jwt_required()
def submit_repair():
    current_user_id = get_jwt_identity()
    
    data = request.form
    image = request.files.get('image')
    
    image_path = None
    if image and allowed_file(image.filename):
        filename = secure_filename(image.filename)
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = f"{timestamp}_{filename}"
        image.save(os.path.join(UPLOAD_FOLDER, filename))
        image_path = f"uploads/{filename}"
    
    repair_id = 'R' + ''.join(random.choices(string.digits, k=10))
    
    repair = Repair(
        repair_id=repair_id,
        user_id=current_user_id,
        facility_type=data.get('facility_type'),
        damage_type=data.get('damage_type'),
        location=data.get('location'),
        description=data.get('description'),
        image=image_path
    )
    
    try:
        db.session.add(repair)
        db.session.commit()
        return jsonify({'success': True, 'repair_id': repair_id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': '提交失败'}), 500

@app.route('/api/repairs', methods=['GET'])
@jwt_required()
def get_repairs():
    current_user_id = get_jwt_identity()
    repairs = Repair.query.filter_by(user_id=current_user_id).order_by(Repair.submit_time.desc()).all()
    return jsonify([repair.to_dict() for repair in repairs])

@app.route('/api/repairs/<repair_id>', methods=['GET'])
@jwt_required()
def get_repair(repair_id):
    repair = Repair.query.filter_by(repair_id=repair_id).first()
    if not repair:
        return jsonify({'success': False, 'message': '报修记录不存在'}), 404
    return jsonify(repair.to_dict())

@app.route('/api/repairs/<repair_id>', methods=['DELETE'])
@jwt_required()
def delete_repair(repair_id):
    current_user_id = get_jwt_identity()
    repair = Repair.query.filter_by(repair_id=repair_id, user_id=current_user_id).first()
    
    if not repair:
        return jsonify({'success': False, 'message': '未找到该报修记录'}), 404
    
    if repair.status != 'pending':
        return jsonify({'success': False, 'message': '只有待受理的报修才能撤销'}), 400
    
    try:
        # 如果有图片，删除图片文件
        if repair.image:
            image_path = os.path.join(UPLOAD_FOLDER, repair.image.replace('uploads/', ''))
            if os.path.exists(image_path):
                os.remove(image_path)
        
        db.session.delete(repair)
        db.session.commit()
        return jsonify({'success': True, 'message': '撤销成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': '撤销失败'}), 500

@app.route('/api/admin/repairs', methods=['GET'])
@jwt_required()
def admin_get_repairs():
    repairs = Repair.query.order_by(Repair.submit_time.desc()).all()
    result = []
    for repair in repairs:
        repair_data = repair.to_dict()
        user = User.query.get(repair.user_id)
        repair_data['user_name'] = user.name if user else '未知'
        repair_data['user_phone'] = user.phone if user else '未知'
        result.append(repair_data)
    return jsonify(result)

@app.route('/api/admin/repairs/<int:id>', methods=['PUT'])
@jwt_required()
def admin_update_repair(id):
    data = request.get_json()
    repair = Repair.query.get(id)
    if not repair:
        return jsonify({'success': False, 'message': '报修记录不存在'}), 404
    
    repair.status = data.get('status', repair.status)
    repair.progress = data.get('progress', repair.progress)
    repair.admin_note = data.get('admin_note', repair.admin_note)
    repair.update_time = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': '更新成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': '更新失败'}), 500

@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify(user.to_dict())

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    user = User.query.get(current_user_id)
    
    if 'name' in data:
        user.name = data['name']
    if 'avatar' in data:
        user.avatar = data['avatar']
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': '更新成功', 'user': user.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': '更新失败'}), 500

# 通知相关路由
@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=current_user_id).order_by(Notification.created_at.desc()).all()
    return jsonify([notification.to_dict() for notification in notifications])

@app.route('/api/notifications/<int:id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(id):
    current_user_id = get_jwt_identity()
    notification = Notification.query.filter_by(id=id, user_id=current_user_id).first()
    
    if not notification:
        return jsonify({'success': False, 'message': '通知不存在'}), 404
    
    notification.read = True
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': '标记成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': '标记失败'}), 500

@app.route('/api/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    current_user_id = get_jwt_identity()
    count = Notification.query.filter_by(user_id=current_user_id, read=False).count()
    return jsonify({'count': count})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)