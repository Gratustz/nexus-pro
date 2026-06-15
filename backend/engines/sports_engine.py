import requests
import pandas as pd
import numpy as np
import logging
from datetime import datetime
from bs4 import BeautifulSoup
from scipy.stats import poisson
from core.config import settings

logger = logging.getLogger(__name__)

EPL_TEAMS = [
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford",
    "Brighton", "Chelsea", "Crystal Palace", "Everton",
    "Fulham", "Ipswich", "Leicester", "Liverpool",
    "Man City", "Man Utd", "Newcastle", "Nottm Forest",
    "Southampton", "Spurs", "West Ham", "Wolves"
]


class SportsEngine:

    def __init__(self):
        self.results = {}
        self.standings = {}
        self.fixtures = []

    def fetch_standings(self) -> dict:
        try:
            url = "https://en.wikipedia.org/wiki/2024-25_Premier_League"
            headers = {"User-Agent": "Mozilla/5.0"}
            response = requests.get(url, headers=headers, timeout=15)
            soup = BeautifulSoup(response.text, "html.parser")
            tables = soup.find_all("table", {"class": "wikitable"})
            standings = {}

            for table in tables:
                rows = table.find_all("tr")[1:]
                for row in rows:
                    cols = row.find_all(["td", "th"])
                    if len(cols) >= 10:
                        try:
                            team = cols[1].get_text(strip=True)
                            played = int(cols[2].get_text(strip=True))
                            won = int(cols[3].get_text(strip=True))
                            drawn = int(cols[4].get_text(strip=True))
                            lost = int(cols[5].get_text(strip=True))
                            gf = int(cols[6].get_text(strip=True))
                            ga = int(cols[7].get_text(strip=True))
                            points = int(cols[9].get_text(strip=True))

                            standings[team] = {
                                "played": played,
                                "won": won,
                                "drawn": drawn,
                                "lost": lost,
                                "goals_for": gf,
                                "goals_against": ga,
                                "points": points,
                                "avg_scored": round(gf / max(played, 1), 2),
                                "avg_conceded": round(ga / max(played, 1), 2),
                            }
                        except Exception:
                            continue

            logger.info(f"Fetched standings for {len(standings)} teams")
            return standings

        except Exception as e:
            logger.error(f"Error fetching standings: {e}")
            return {}

    def fetch_news_sentiment(self, team: str) -> float:
        try:
            query = f"{team} FC injury suspension news"
            url = f"https://news.google.com/rss/search?q={query}&hl=en"
            headers = {"User-Agent": "Mozilla/5.0"}
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.text, "xml")
            items = soup.find_all("item")[:5]

            negative_keywords = [
                "injury", "injured", "suspension", "suspended",
                "ruled out", "doubt", "miss", "ban", "banned"
            ]
            positive_keywords = [
                "return", "fit", "available", "back", "recovered"
            ]

            score = 0.0
            for item in items:
                title = item.find("title")
                if title:
                    text = title.get_text().lower()
                    for kw in negative_keywords:
                        if kw in text:
                            score -= 0.1
                    for kw in positive_keywords:
                        if kw in text:
                            score += 0.05

            return round(max(-0.5, min(0.5, score)), 2)

        except Exception as e:
            logger.error(f"Error fetching news for {team}: {e}")
            return 0.0

    def predict_match(
        self,
        home_team: str,
        away_team: str,
        standings: dict
    ) -> dict:
        try:
            if home_team not in standings or away_team not in standings:
                return {}

            home = standings[home_team]
            away = standings[away_team]

            all_scored = [t["avg_scored"] for t in standings.values()]
            all_conceded = [t["avg_conceded"] for t in standings.values()]
            league_avg_scored = np.mean(all_scored)
            league_avg_conceded = np.mean(all_conceded)

            home_attack = home["avg_scored"] / max(league_avg_scored, 0.01)
            home_defence = home["avg_conceded"] / max(league_avg_conceded, 0.01)
            away_attack = away["avg_scored"] / max(league_avg_scored, 0.01)
            away_defence = away["avg_conceded"] / max(league_avg_conceded, 0.01)

            home_xg = home_attack * away_defence * league_avg_scored * 1.1
            away_xg = away_attack * home_defence * league_avg_scored

            home_sentiment = self.fetch_news_sentiment(home_team)
            away_sentiment = self.fetch_news_sentiment(away_team)

            home_xg = max(0.1, home_xg + home_sentiment)
            away_xg = max(0.1, away_xg + away_sentiment)

            max_goals = 6
            prob_matrix = np.zeros((max_goals + 1, max_goals + 1))

            for i in range(max_goals + 1):
                for j in range(max_goals + 1):
                    prob_matrix[i][j] = (
                        poisson.pmf(i, home_xg) *
                        poisson.pmf(j, away_xg)
                    )

            home_win = round(float(np.sum(np.tril(prob_matrix, -1))) * 100, 1)
            draw = round(float(np.sum(np.diag(prob_matrix))) * 100, 1)
            away_win = round(float(np.sum(np.triu(prob_matrix, 1))) * 100, 1)

            home_odds = round(100 / max(home_win, 0.1), 2)
            draw_odds = round(100 / max(draw, 0.1), 2)
            away_odds = round(100 / max(away_win, 0.1), 2)

            flat = prob_matrix.flatten()
            top_indices = flat.argsort()[-5:][::-1]
            correct_scores = []
            for idx in top_indices:
                h = idx // (max_goals + 1)
                a = idx % (max_goals + 1)
                prob = round(prob_matrix[h][a] * 100, 1)
                correct_scores.append(f"{h}-{a} ({prob}%)")

            if home_win > 55:
                signal = f"{home_team} WIN"
            elif away_win > 55:
                signal = f"{away_team} WIN"
            elif draw > 35:
                signal = "DRAW LIKELY"
            else:
                signal = "TOO CLOSE TO CALL"

            return {
                "home_team": home_team,
                "away_team": away_team,
                "home_xg": round(home_xg, 2),
                "away_xg": round(away_xg, 2),
                "home_win_pct": home_win,
                "draw_pct": draw,
                "away_win_pct": away_win,
                "home_odds": home_odds,
                "draw_odds": draw_odds,
                "away_odds": away_odds,
                "correct_scores": correct_scores,
                "signal": signal,
                "home_sentiment": home_sentiment,
                "away_sentiment": away_sentiment,
                "analyzed_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error predicting {home_team} vs {away_team}: {e}")
            return {}

    async def run(self) -> dict:
        results = {}
        standings = self.fetch_standings()

        if not standings:
            logger.warning("No standings data available")
            return {}

        self.standings = standings
        teams = list(standings.keys())

        for i in range(len(teams)):
            for j in range(i + 1, min(i + 3, len(teams))):
                home = teams[i]
                away = teams[j]
                match_key = f"{home} vs {away}"
                prediction = self.predict_match(home, away, standings)

                if prediction:
                    results[match_key] = prediction
                    logger.info(
                        f"Predicted: {match_key} → {prediction.get('signal')}"
                    )

        self.results = results
        return results