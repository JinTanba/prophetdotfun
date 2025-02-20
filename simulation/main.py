import os
os.environ['STREAMLIT_WATCH_PATHS'] = '.'

import streamlit as st
import numpy as np
from sentence_transformers import SentenceTransformer
import plotly.express as px
from sklearn.decomposition import PCA
import pandas as pd

# Page settings
st.set_page_config(page_title="Threshold-based Fund Transfer Demo", layout="wide")
st.title("Oracle × User Statements: Threshold-based Fund Transfer")

@st.cache_resource
def load_model():
    return SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

model = load_model()

# Default example statements
DEFAULT_STATEMENTS = """Alice, iPhone 16 will feature USB-C ports across all models, 500
Bob, iPhone 16 Pro will have a periscope camera with 10x optical zoom, 300
Charlie, iPhone 16 will maintain the same price as iPhone 15, 200
David, iPhone 16 Pro Max will cost $1299 as starting price, 400
Emma, iPhone 16 will have improved battery life by 20%, 250
Frank, iPhone 16 Pro will feature titanium frame like 15 Pro, 350
Grace, iPhone 16 will introduce reverse wireless charging, 150
Henry, iPhone 16 Pro will have a new Action button with haptic feedback, 300
Ivy, iPhone 16 will keep the same camera setup as iPhone 15, 200
Jack, iPhone 16 Pro will have an under-display Face ID system, 450
Kelly, iPhone 16 will feature faster 5G capabilities, 250
Liam, iPhone 16 Pro will have a larger battery capacity, 300
Maya, iPhone 16 will maintain Lightning port for base model, 400
Noah, iPhone 16 Pro will have improved thermal management, 350
Olivia, iPhone 16 will feature satellite messaging for all models, 200"""

st.header("1. User Statements & Bet Amounts")
st.markdown("""
- Enter "Username, Statement, Bet Amount" separated by newlines in the text area.
- Example:
Alice, iPhone will adopt USB-C, 200
Bob, iPhone will keep Lightning, 100
Charlie, Weather is nice, 50
            """)

user_input = st.text_area("User Information", value=DEFAULT_STATEMENTS, height=150)

st.header("2. Oracle Statement & Threshold")
oracle_sentence = st.text_input("Oracle Statement", "iPhone will adopt USB-C")
threshold = st.slider("Threshold for irrelevance detection (compared as absolute value)", 0.0, 1.0, 0.5, 0.01)

# ステートメント管理のためのクラスを追加
class Statement:
    def __init__(self, text):
        self.text = text
        self.topics = detect_topics(text)  # 複数トピックを保持
        self.supporters = []
        self.embedding = None
        self.positions = {}  # トピックごとのポジション
        self.cos_sims = {}   # トピックごとのコサイン類似度

class Topic:
    def __init__(self, name, keywords):
        self.name = name
        self.keywords = keywords
        self.statements = []  # Statement objects

# Topic definitions modified
topics = {
    'connector': Topic('connector', {
        'positive': ['usb-c', 'usb c', 'type-c', 'usbc'],
        'negative': ['lightning']
    }),
    'price': Topic('price', {
        'positive': ['expensive', 'high price', 'price increase', 'costly'],
        'negative': ['cheap', 'low price', 'price decrease']
    })
}

# ステートメントのトピック判定関数を複数トピック対応に修正
def detect_topics(text):
    text_lower = text.lower()
    detected = []
    for topic_name, topic in topics.items():
        if any(k in text_lower for k in topic.keywords['positive']) or \
           any(k in text_lower for k in topic.keywords['negative']):
            detected.append(topic_name)
    return detected

if st.button("Execute Calculation"):
    # セッションステートの初期化
    if 'calculation_done' not in st.session_state:
        st.session_state.calculation_done = True
        
    # Parse user data and create statements
    statements = []
    for line in [l.strip() for l in user_input.split('\n') if l.strip()]:
        parts = [p.strip() for p in line.split(',')]
        if len(parts) == 3:
            name, text, bet_str = parts
            try:
                bet_val = float(bet_str)
                stmt = Statement(text)
                stmt.supporters.append((name, bet_val))
                statements.append(stmt)
            except:
                continue
    
    # Store statements in session state
    st.session_state.statements = statements

# 計算が実行された後の表示
if hasattr(st.session_state, 'calculation_done'):
    statements = st.session_state.statements
    
    if not statements:
        st.warning("User data is not entered correctly.")
    else:
        # アニメーション制御用のセクション
        st.subheader("◆ Interactive Visualization of Fund Transfer Process")
        
        # セッションステートでステップを管理
        if 'current_step' not in st.session_state:
            st.session_state.current_step = "1. Show All Statements"
        
        steps = ["1. Show All Statements", "2. Add Oracle", "3. Connect Similar Opinions", "4. Show Fund Transfer"]
        st.session_state.current_step = st.radio("Visualization Steps", steps, key='step_radio')
        
        # 基本的なデータ準備（全ステップで使用）
        all_statements = [s.text for s in statements]
        all_embeddings = model.encode(all_statements)
        oracle_embedding = model.encode([oracle_sentence])[0]
        
        # 全embeddings（Oracle含む）
        combined_embeddings = np.vstack([all_embeddings, oracle_embedding.reshape(1, -1)])
        
        # PCA変換
        pca = PCA(n_components=3)
        all_3d = pca.fit_transform(combined_embeddings)
        
        statements_3d = all_3d[:-1]
        oracle_3d = all_3d[-1]
        
        # 基本的なデータフレーム作成
        plot_df = pd.DataFrame({
            'x': statements_3d[:, 0],
            'y': statements_3d[:, 1],
            'z': statements_3d[:, 2],
            'Statement': all_statements,
            'User': [s.supporters[0][0] for s in statements],
            'Initial_Bet': [s.supporters[0][1] for s in statements],
            'Topics': [', '.join(s.topics) if s.topics else 'No topic' for s in statements]
        })
        
        # コサイン類似度の計算
        similarities = np.array([
            np.dot(emb, oracle_embedding) / (np.linalg.norm(emb) * np.linalg.norm(oracle_embedding))
            for emb in all_embeddings
        ])
        plot_df['Similarity'] = similarities
        
        # ステップごとの表示処理
        if st.session_state.current_step == "1. Show All Statements":
            fig = px.scatter_3d(
                plot_df,
                x='x', y='y', z='z',
                color='Topics',
                size='Initial_Bet',
                text='Statement',
                hover_data=['User', 'Initial_Bet', 'Similarity'],
                title='Initial Statement Distribution'
            )
            
        elif st.session_state.current_step == "2. Add Oracle":
            fig = px.scatter_3d(
                plot_df,
                x='x', y='y', z='z',
                color='Topics',
                size='Initial_Bet',
                text='Statement',
                hover_data=['User', 'Initial_Bet', 'Similarity'],
                title='Statements with Oracle Position'
            )
            
            # Oracle点の追加
            fig.add_scatter3d(
                x=[oracle_3d[0]], y=[oracle_3d[1]], z=[oracle_3d[2]],
                mode='markers+text',
                marker=dict(size=15, color='red', symbol='diamond'),
                text=[f"Oracle: {oracle_sentence}"],
                name="Oracle"
            )
            
        elif st.session_state.current_step == "3. Connect Similar Opinions":
            # 類似度でフィルタリング
            if 'similarity_threshold' not in st.session_state:
                st.session_state.similarity_threshold = 0.7
            
            st.session_state.similarity_threshold = st.slider(
                "Similarity Threshold", 
                0.0, 1.0, 
                st.session_state.similarity_threshold,
                key='similarity_slider'
            )
            
            fig = px.scatter_3d(
                plot_df,
                x='x', y='y', z='z',
                color='Similarity',
                size='Initial_Bet',
                text='Statement',
                hover_data=['User', 'Initial_Bet', 'Similarity'],
                color_continuous_scale='RdYlBu',
                title=f'Connected Statements (Similarity > {st.session_state.similarity_threshold})'
            )
            
            # Oracle点の追加
            fig.add_scatter3d(
                x=[oracle_3d[0]], y=[oracle_3d[1]], z=[oracle_3d[2]],
                mode='markers+text',
                marker=dict(size=15, color='red', symbol='diamond'),
                text=[f"Oracle: {oracle_sentence}"],
                name="Oracle"
            )
            
            # 類似度の高い意見同士を線で接続
            for i, row in plot_df.iterrows():
                if row['Similarity'] > st.session_state.similarity_threshold:
                    fig.add_scatter3d(
                        x=[row['x'], oracle_3d[0]],
                        y=[row['y'], oracle_3d[1]],
                        z=[row['z'], oracle_3d[2]],
                        mode='lines',
                        line=dict(color='rgba(100,100,100,0.5)', width=2),
                        showlegend=False
                    )
            
        else:  # "4. Show Fund Transfer"
            # 資金移動後の金額を計算
            plot_df['Final_Bet'] = [
                s.supporters[0][1] * (1 + sim) if sim > 0 else s.supporters[0][1] * (1 - abs(sim))
                for s, sim in zip(statements, similarities)
            ]
            
            fig = px.scatter_3d(
                plot_df,
                x='x', y='y', z='z',
                color='Final_Bet',
                size='Final_Bet',
                text='Statement',
                hover_data=['User', 'Initial_Bet', 'Final_Bet', 'Similarity'],
                color_continuous_scale='Viridis',
                title='Final Fund Distribution'
            )
            
            # Oracle点の追加
            fig.add_scatter3d(
                x=[oracle_3d[0]], y=[oracle_3d[1]], z=[oracle_3d[2]],
                mode='markers+text',
                marker=dict(size=15, color='red', symbol='diamond'),
                text=[f"Oracle: {oracle_sentence}"],
                name="Oracle"
            )
            
            # 資金移動の変化を表示
            st.write("Fund Transfer Summary:")
            for _, row in plot_df.iterrows():
                change = row['Final_Bet'] - row['Initial_Bet']
                if abs(change) > 0.01:  # 小さな変化は表示しない
                    if change > 0:
                        st.success(f"{row['User']}: {row['Initial_Bet']:.2f} → {row['Final_Bet']:.2f} (+{change:.2f})")
                    else:
                        st.error(f"{row['User']}: {row['Initial_Bet']:.2f} → {row['Final_Bet']:.2f} ({change:.2f})")
        
        # 共通のプロット設定
        fig.update_traces(
            textposition='top center',
            marker=dict(opacity=0.7),
            textfont=dict(size=8)
        )
        
        fig.update_layout(
            scene=dict(
                xaxis_title='X',
                yaxis_title='Y',
                zaxis_title='Z'
            ),
            showlegend=True,
            scene_camera=dict(
                eye=dict(x=1.5, y=1.5, z=1.5)
            )
        )
        
        # プロットの表示
        st.plotly_chart(fig, use_container_width=True)

else:
    st.write("Please enter input and click the 'Execute Calculation' button.")
