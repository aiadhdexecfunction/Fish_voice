# run_with_composio.py
from typing import List
from fastapi import FastAPI

from app import app as base_app         # 复用你现有的 app
from composio_plugin import router as composio_router, start_watchers
from users.router import router as users_router
from users.service import users_with_connected_accounts  # 用来读取已完成 OAuth 的用户

app: FastAPI = base_app
app.include_router(users_router)        # /users/*
app.include_router(composio_router)     # /composio/*

@app.on_event("startup")
async def _start_watchers():
    # 从 DB 读出已完成 Gmail/Calendar 授权的用户列表（初版可以为空）
    uids: List[str] = users_with_connected_accounts()
    if uids:
        await start_watchers(uids)
