"""Database seeding script for frontend debugging and demo data."""

from __future__ import annotations

import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import SessionLocal
from app.models import (
    LibraryTrack,
    MemberRole,
    ModerationStatus,
    QueueItem,
    QueueItemState,
    Room,
    RoomMember,
    Track,
    TrackSource,
    User,
    Vote,
    VoteEvent,
)
from app.services import create_playlist_round

DEFAULT_STUDIO_TRACKS = [
    {
        "key": "bustin",
        "title": "Bustin Loose With Lead",
        "artist": "Audionautix",
        "genre": "Рок",
        "duration": "2:08",
        "duration_seconds": 128,
        "color": "#e05638",
        "gradient": "from-red-600 via-orange-600 to-amber-700",
        "description": "Драйвовый классический гитарный рок с мощными риффами и энергичным соло.",
        "file": "bustin_loose.mp3",
    },
    {
        "key": "funk90",
        "title": "90 Seconds Of Funk",
        "artist": "Audionautix",
        "genre": "Фанк",
        "duration": "1:31",
        "duration_seconds": 91,
        "color": "#f59e0b",
        "gradient": "from-amber-500 via-yellow-600 to-orange-700",
        "description": "Качающий фанковый ритм с пружинистым слэп-басом и ярким грувом.",
        "file": "90_seconds_of_funk.mp3",
    },
    {
        "key": "cents5",
        "title": "5 Cents Back",
        "artist": "Audionautix",
        "genre": "Рок",
        "duration": "1:54",
        "duration_seconds": 114,
        "color": "#3b82f6",
        "gradient": "from-blue-600 via-indigo-600 to-cyan-700",
        "description": "Блюз-роковый ритм с глубоким звучанием электрогитары и плотным басом.",
        "file": "5_cents_back.mp3",
    },
    {
        "key": "fallingsky",
        "title": "Falling Sky",
        "artist": "Audionautix",
        "genre": "Хаус",
        "duration": "4:12",
        "duration_seconds": 252,
        "color": "#8b5cf6",
        "gradient": "from-purple-600 via-violet-700 to-pink-700",
        "description": "Клубный атмосферный хаус с глубокой бочкой, синтами и танцевальным настроением.",
        "file": "falling_sky.mp3",
    },
    {
        "key": "dawn",
        "title": "Первые лучи",
        "artist": "Volna Studio",
        "genre": "Эмбиент",
        "duration": "0:48",
        "duration_seconds": 48,
        "color": "#f4b782",
        "gradient": "from-amber-500 via-orange-600 to-amber-700",
        "description": "Мягкий атмосферный саундскейп для медитации, учёбы и спокойного утра.",
        "file": None,
    },
    {
        "key": "city",
        "title": "После пар",
        "artist": "Volna Studio",
        "genre": "Лоу-фай",
        "duration": "0:56",
        "duration_seconds": 56,
        "color": "#b2a1df",
        "gradient": "from-violet-600 via-purple-700 to-indigo-900",
        "description": "Теплый винтажный лоу-фай бит с мягкими клавишными для вечерней прогулки.",
        "file": None,
    },
    {
        "key": "orbit",
        "title": "Орбита",
        "artist": "Volna Studio",
        "genre": "Электроника",
        "duration": "0:52",
        "duration_seconds": 52,
        "color": "#80cdd3",
        "gradient": "from-cyan-500 via-teal-600 to-blue-800",
        "description": "Космический пульсирующий синтезаторный грув с ритмичной перкуссией.",
        "file": None,
    },
    {
        "key": "rain",
        "title": "Тихий двор",
        "artist": "Volna Studio",
        "genre": "Инди",
        "duration": "0:44",
        "duration_seconds": 44,
        "color": "#a8c794",
        "gradient": "from-emerald-500 via-teal-600 to-green-800",
        "description": "Меланхоличные аккорды с акустическим теплом и шумом лёгкого дождя.",
        "file": None,
    },
    {
        "key": "night",
        "title": "Ночной маршрут",
        "artist": "Volna Studio",
        "genre": "Синтвейв",
        "duration": "1:00",
        "duration_seconds": 60,
        "color": "#f099b2",
        "gradient": "from-pink-500 via-rose-600 to-purple-800",
        "description": "Энергичный ретро-синтвейв с пилообразными басами и огнями ночного города.",
        "file": None,
    },
    {
        "key": "sea",
        "title": "Морской бриз",
        "artist": "Volna Studio",
        "genre": "Чилаут",
        "duration": "0:50",
        "duration_seconds": 50,
        "color": "#76c7c0",
        "gradient": "from-teal-400 via-cyan-600 to-sky-800",
        "description": "Освежающий лёгкий чилаут с шумом волн и воздушными гармониями.",
        "file": None,
    },
]


def seed_library_tracks(db: Session):
    """Ensure all default studio tracks exist in the library_tracks table."""
    added = 0
    for item in DEFAULT_STUDIO_TRACKS:
        existing = db.scalar(select(LibraryTrack).where(LibraryTrack.key == item["key"]))
        if existing is None:
            t = LibraryTrack(
                key=item["key"],
                title=item["title"],
                artist=item["artist"],
                genre=item["genre"],
                duration=item["duration"],
                duration_seconds=item["duration_seconds"],
                color=item["color"],
                gradient=item["gradient"],
                description=item["description"],
                file=item.get("file"),
            )
            db.add(t)
            added += 1
    if added:
        db.commit()
        print(f"   [+] Добавлено {added} студийных треков в таблицу library_tracks.")


def seed_database():
    print("[*] Заполнение базы данных тестовыми данными для отладки UI...")
    db: Session = SessionLocal()
    try:
        # 0. Заполняем студийную фонотеку в БД
        seed_library_tracks(db)

        # 1. Проверяем или создаем демо-пользователя
        demo_email = "demo@zvuk.local"
        user = db.scalar(select(User).where(User.email == demo_email))
        if user is None:
            user = User(
                email=demo_email,
                password_hash=hash_password("DemoPassword123!"),
                display_name="Студент СПбГУ",
                avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            )
            db.add(user)
            db.flush()
            print(f"   [+] Создан демо-пользователь: {demo_email} (пароль: DemoPassword123!)")
        else:
            print(f"   [i] Демо-пользователь уже существует: {demo_email}")

        # 2. Создаем демо-плейлист (комнату)
        demo_room_name = "ИИНОД-82"
        room = db.scalar(select(Room).where(Room.name == demo_room_name))
        if room is None:
            room = Room(
                name=demo_room_name,
                faculty="ИИНОД-82",
                description="Главный плейлист базового сообщества ИИНОД-82: предлагайте треки, голосуйте и слушайте вместе!",
                avatar_url="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
                external_link="https://zvuk.com",
                invite_code="ZVUK26",
                owner_id=user.id,
            )
            db.add(room)
            db.flush()
            db.add(RoomMember(room_id=room.id, user_id=user.id, role=MemberRole.OWNER))
            db.flush()
            print(f"   [+] Создана комната: '{demo_room_name}' (инвайт-код: ZVUK26)")
        else:
            print(f"   [i] Демо-комната уже существует: '{demo_room_name}'")

        # 3. Создаем активную ротацию
        round_obj = create_playlist_round(db, room.id, user.id)
        db.flush()

        # 4. Добавляем 5 треков из библиотеки
        tracks_to_add = DEFAULT_STUDIO_TRACKS[:5]
        created_tracks = []
        for item in tracks_to_add:
            existing_track = db.scalar(
                select(Track).where(Track.room_id == room.id, Track.library_key == item["key"])
            )
            if existing_track is None:
                track = Track(
                    room_id=room.id,
                    title=item["title"],
                    artist=item["artist"],
                    genre=item["genre"],
                    duration_seconds=item["duration_seconds"],
                    source_type=TrackSource.LIBRARY,
                    library_key=item["key"],
                    moderation_status=ModerationStatus.APPROVED,
                    created_by_user_id=user.id,
                )
                db.add(track)
                db.flush()
                created_tracks.append(track)

                # Добавляем в очередь раунда
                q_item = QueueItem(
                    room_id=room.id,
                    round_id=round_obj.id,
                    track_id=track.id,
                    added_by_user_id=user.id,
                    state=QueueItemState.QUEUED,
                    version=room.queue_version,
                )
                db.add(q_item)
                db.flush()

                # Добавим голос за первые треки для демонстрации ранжирования
                if len(created_tracks) <= 2:
                    db.add(Vote(queue_item_id=q_item.id, user_id=user.id, value=1))
                    db.add(VoteEvent(queue_item_id=q_item.id, user_id=user.id, old_value=0, new_value=1))

        db.commit()
        if created_tracks:
            print(f"   [OK] Успешно добавлено {len(created_tracks)} треков с голосами в очередь.")
        print("[OK] База данных готова к демонстрации и отладке интерфейса!")
        print(f"   * Код комнаты для входа: ZVUK26")
        print(f"   * URL комнаты: http://localhost:5173/?invite=ZVUK26")
    except Exception as e:
        db.rollback()
        print(f"   [!] Ошибка при заполнении: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
