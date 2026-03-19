import pandas as pd
import chess
import json
df = pd.read_csv("./data/games.csv")
df = df[df["rated"]]
df.drop(columns=["id", "victory_status", "created_at", "last_move_at", "rated", "white_id", "black_id", "turns"], inplace=True)
def helper(move_str):
    board = chess.Board()
    coords = []
    for move_text in move_str.split():
        move = board.parse_san(move_text)
        coords.append(f"{chess.square_name(move.from_square)}{chess.square_name(move.to_square)}")
        board.push(move)
    return coords

df["coords"] = df["moves"].apply(helper)

df.to_csv("./data/processed.csv")

move_stats = {}
for coords_list in df["coords"]:
    for i, move in enumerate(coords_list):
        if i not in move_stats:
            move_stats[i] = {}
        move_stats[i][move] = move_stats[i].get(move, 0) + 1
with open("./data/move_freq.json", "w") as f:
    json.dump(move_stats, f)
