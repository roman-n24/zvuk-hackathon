"""Add library_tracks table for studio music collection.

Revision ID: 003_add_library_tracks
Revises: 002_auth_and_playlists
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "003_add_library_tracks"
down_revision: str | None = "002_auth_and_playlists"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "library_tracks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("artist", sa.String(length=255), server_default="", nullable=False),
        sa.Column("genre", sa.String(length=100), server_default="", nullable=False),
        sa.Column("duration", sa.String(length=50), server_default="", nullable=False),
        sa.Column("duration_seconds", sa.Integer(), server_default="0", nullable=False),
        sa.Column("color", sa.String(length=50), server_default="#a3e635", nullable=False),
        sa.Column("gradient", sa.String(length=255), server_default="", nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("file", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key", name="uq_library_tracks_key"),
    )
    op.create_index("ix_library_tracks_key", "library_tracks", ["key"])
    op.create_index("ix_library_tracks_genre", "library_tracks", ["genre"])


def downgrade() -> None:
    op.drop_index("ix_library_tracks_genre", table_name="library_tracks")
    op.drop_index("ix_library_tracks_key", table_name="library_tracks")
    op.drop_table("library_tracks")
