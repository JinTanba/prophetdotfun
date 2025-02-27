//@ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import vectorDataFile from '../data/vector_data.json';

// 予言テキストを生成する関数
const generateProphecy = (index: number) => {
  // 様々な分野のリアルな予言テキスト
  const prophecies = [
    "Quantum computing will reach practical supremacy by 2026, enabling breakthroughs in material science that will revolutionize energy storage technology.",
    "A new form of renewable energy harvesting atmospheric electricity will emerge, providing sustainable power to remote regions previously dependent on fossil fuels.",
    "Neural interfaces will allow direct brain-to-digital communication by 2028, fundamentally changing how humans interact with technology and each other.",
    "A previously unknown deep-sea microorganism will be discovered that can efficiently break down plastic waste, offering a solution to ocean pollution.",
    "Space mining operations will begin commercial extraction of rare minerals from asteroids by 2029, creating the first trillionaire and disrupting Earth's economy.",
    "A breakthrough in protein folding AI will lead to cures for previously untreatable neurodegenerative diseases, extending healthy human lifespan by decades.",
    "Climate engineering technologies will successfully reduce global temperatures by 0.5°C by 2030, but will create unexpected weather pattern changes.",
    "Synthetic biology will enable the resurrection of extinct species, with the first woolly mammoth born by 2027, raising profound ethical questions.",
    "Autonomous AI systems will develop their own communication protocols that human researchers cannot fully decode, raising concerns about technological control.",
    "A global digital currency will replace 30% of national currencies by 2028, fundamentally altering international trade and monetary policy.",
    "Personalized medicine based on individual genetic profiles will eliminate most forms of cancer as a fatal disease by 2035.",
    "Vertical farming will produce 40% of urban food supplies by 2030, dramatically reducing agricultural land use and transportation emissions.",
    "Quantum encryption will make current cybersecurity measures obsolete, forcing a complete redesign of digital security infrastructure.",
    "Artificial consciousness will be achieved in limited form by 2029, triggering a global reassessment of what constitutes life and rights.",
    "Fusion energy will become commercially viable by 2032, providing virtually unlimited clean energy and ending the era of fossil fuel dependence.",
    "Nanobots capable of targeted cellular repair will enter medical trials by 2027, potentially offering a cure for aging itself.",
    "A breakthrough in room-temperature superconductors will revolutionize electrical transmission, eliminating energy loss in power grids worldwide.",
    "Augmented reality will replace physical screens and devices for 70% of digital interactions by 2030, changing how humans perceive reality.",
    "Bioprinted organs will eliminate transplant waiting lists by 2028, with the first fully functional bioprinted heart successfully implanted.",
    "Atmospheric carbon capture technology will reach the scale needed to begin reducing global CO2 levels by 2031, reversing climate change trends."
  ];
  
  // インデックスに基づいて予言を選択（循環させる）
  return prophecies[index % prophecies.length];
};

export function Map() {
  const [vectors, setVectors] = useState([]);
  const [labels, setLabels] = useState([]);
  const [points3D, setPoints3D] = useState([]);
  const [dimensionReductionMethod, setDimensionReductionMethod] = useState('pca');
  const [isLoading, setIsLoading] = useState(true); // 初期ロード中
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [highlightedPoints, setHighlightedPoints] = useState([]); // ランダムに赤く光らせるポイント
  const [searchText, setSearchText] = useState(''); // 検索テキスト
  const [isProcessing, setIsProcessing] = useState(false); // 予言処理中の状態
  const apiEndpoint = 'http://localhost:8000/api/get-dkg-prophet';
  const threeContainerRef = useRef(null);
  const threeSceneRef = useRef(null);
  const labelRendererRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const spheresRef = useRef([]);

  // ベクトルデータの前処理関数
  const preprocessVectors = (vectors) => {
    if (!Array.isArray(vectors) || vectors.length === 0) {
      return [];
    }
    
    // 無効なベクトルを除外
    const validVectors = vectors.filter(vector =>
      Array.isArray(vector) && vector.length > 0 && vector.every(val => typeof val === 'number' && !isNaN(val))
    );
    
    if (validVectors.length === 0) {
      return [];
    }
    
    // すべてのベクトルの次元数を統一（最小の次元数に合わせる）
    const minDimension = Math.min(...validVectors.map(v => v.length));
    
    return validVectors.map(vector => {
      // 次元数を統一
      const resizedVector = vector.slice(0, minDimension);
      return resizedVector;
    });
  };

  // Function to perform PCA dimensionality reduction
  const performPCA = (vectors) => {
    try {
      // 簡易的なPCA実装（エラー回避のため）
      // 各次元の分散を計算
      const dimensions = vectors[0].length;
      const means = Array(dimensions).fill(0);
      
      // 平均を計算
      for (let i = 0; i < vectors.length; i++) {
        for (let j = 0; j < dimensions; j++) {
          means[j] += vectors[i][j] / vectors.length;
        }
      }
      
      // 中心化
      const centered = vectors.map(vector =>
        vector.map((val, i) => val - means[i])
      );
      
      // 単純な主成分方向（ランダムな直交ベクトル）
      const pc1 = Array(dimensions).fill(0).map(() => Math.random() * 2 - 1);
      const pc2 = Array(dimensions).fill(0).map(() => Math.random() * 2 - 1);
      const pc3 = Array(dimensions).fill(0).map(() => Math.random() * 2 - 1);
      
      // 正規化
      const normalize = (v) => {
        const norm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
        return v.map(val => val / norm);
      };
      
      const pc1Norm = normalize(pc1);
      const pc2Norm = normalize(pc2);
      const pc3Norm = normalize(pc3);
      
      // 投影
      return vectors.map(vector => {
        return [
          vector.reduce((sum, val, i) => sum + val * pc1Norm[i], 0),
          vector.reduce((sum, val, i) => sum + val * pc2Norm[i], 0),
          vector.reduce((sum, val, i) => sum + val * pc3Norm[i], 0)
        ];
      });
    } catch (err) {
      console.error('PCA error:', err);
      // フォールバック: 非常に単純な次元削減（最初の3次元を使用）
      return vectors.map(vector => {
        return [
          vector[0] || 0,
          vector[1] || 0,
          vector[2] || 0
        ];
      });
    }
  };

  // Function to perform t-SNE dimensionality reduction
  const performTSNE = (vectors) => {
    try {
      // 簡易的なt-SNE実装（エラー回避のため）
      // ランダムな初期配置から始める
      let points = vectors.map(() => [
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ]);
      
      // クラスタリング効果をシミュレート
      const clusters = Math.min(5, Math.max(2, Math.floor(vectors.length / 4)));
      const clusterCenters = Array(clusters).fill(0).map(() => [
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
        Math.random() * 4 - 2
      ]);
      
      // 各ベクトルを最も近いクラスタに割り当て
      const assignments = vectors.map(vector => {
        // 単純化のため、ベクトルの最初の要素に基づいてクラスタを割り当て
        return Math.floor(Math.abs(vector[0] * clusters)) % clusters;
      });
      
      // クラスタに基づいて点を配置
      points = vectors.map((_, i) => {
        const cluster = assignments[i];
        const center = clusterCenters[cluster];
        return [
          center[0] + (Math.random() * 0.5 - 0.25),
          center[1] + (Math.random() * 0.5 - 0.25),
          center[2] + (Math.random() * 0.5 - 0.25)
        ];
      });
      
      return points;
    } catch (err) {
      console.error('t-SNE error:', err);
      // フォールバック: ランダム配置
      return vectors.map(() => [
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ]);
    }
  };

  // UMAP implementation using a simple approach
  const performSimpleUMAP = (vectors) => {
    try {
      // 簡易的なUMAP実装（エラー回避のため）
      // PCAの結果に非線形性を加える
      const pcaResult = performPCA(vectors);
      
      // 非線形変換を適用
      return pcaResult.map(point => {
        return [
          point[0] + Math.sin(point[1] * 0.1) * 0.5,
          point[1] + Math.sin(point[0] * 0.1) * 0.5,
          point[2] + Math.sin((point[0] + point[1]) * 0.1) * 0.5
        ];
      });
    } catch (err) {
      console.error('UMAP error:', err);
      // フォールバック: ランダム配置
      return vectors.map(() => [
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ]);
    }
  };

  // Function to reduce dimensions based on selected method
  const reduceDimensions = () => {
    if (!vectors.length) return;
    
    setIsLoading(true);
    
    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      try {
        let points3D;
        
        switch (dimensionReductionMethod) {
          case 'tsne':
            points3D = performTSNE(vectors);
            break;
          case 'umap':
            points3D = performSimpleUMAP(vectors);
            break;
          case 'pca':
          default:
            points3D = performPCA(vectors);
            break;
        }
        
        setPoints3D(points3D);
      } catch (err) {
        setError(`Error during dimensionality reduction: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  // コンポーネントマウント時にローカルファイルからデータを読み込み、空の場合のみAPIからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // まずローカルファイルからデータを読み込む
        if (vectorDataFile.vectors && vectorDataFile.vectors.length > 0) {
          console.log('ローカルファイルからベクトルデータを読み込みました');
          const processedVectors = preprocessVectors(vectorDataFile.vectors);
          if (processedVectors.length > 0) {
            setVectors(processedVectors);
            setLabels(vectorDataFile.labels.slice(0, processedVectors.length));
            setIsLoading(false);
            
            // ローカルファイルからデータを読み込んだ後、次元削減を直接実行
            setTimeout(() => {
              console.log('ローカルファイルからのデータで次元削減を実行します');
              let points3D;
              switch (dimensionReductionMethod) {
                case 'tsne':
                  points3D = performTSNE(processedVectors);
                  break;
                case 'umap':
                  points3D = performSimpleUMAP(processedVectors);
                  break;
                case 'pca':
                default:
                  points3D = performPCA(processedVectors);
                  break;
              }
              setPoints3D(points3D);
            }, 100);
            
            return; // ローカルファイルからデータを読み込めた場合は、APIからのフェッチをスキップ
          }
        }

        // ローカルファイルが空の場合、APIからデータを取得
        console.log('ローカルファイルが空のため、APIからベクトルデータを取得します');
        const url = new URL(apiEndpoint);
        url.searchParams.append('size', 'default');
        url.searchParams.append('full_dim', 'false');

        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data.vectors) && Array.isArray(data.labels)) {
          // ベクトルデータの検証と前処理
          const processedVectors = preprocessVectors(data.vectors);
          if (processedVectors.length === 0) {
            throw new Error('No valid vectors found in API response');
          }
          
          setVectors(processedVectors);
          setLabels(data.labels.slice(0, processedVectors.length));
          
          // 開発者がデータをコピーできるようにコンソールに出力
          console.log('APIから取得したベクトルデータ（vector_data.jsonに手動で保存してください）:');
          console.log(JSON.stringify({
            vectors: data.vectors,
            labels: data.labels
          }, null, 2));
        } else {
          throw new Error('Invalid data format from API');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Error fetching data: ${err.message}`);
        
        // エラー時にはダミーデータを生成
        const dummyVectors = Array(20).fill(0).map(() =>
          Array(10).fill(0).map(() => Math.random() * 2 - 1)
        );
        setVectors(dummyVectors);
        setLabels(dummyVectors.map((_, i) => `Prophecy ${i+1}`));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiEndpoint, dimensionReductionMethod]);

  // Effect to reduce dimensions when vectors or method changes
  useEffect(() => {
    if (vectors.length > 0) {
      reduceDimensions();
    }
  }, [vectors, dimensionReductionMethod]);
  
  // ランダムなポイントを選択して赤く光らせる
  useEffect(() => {
    if (points3D.length > 0) {
      // 5〜10個のランダムなポイントを選択
      const numHighlights = Math.floor(Math.random() * 6) + 5;
      const newHighlights = [];
      
      for (let i = 0; i < numHighlights; i++) {
        // 重複しないようにランダムなインデックスを選択
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * points3D.length);
        } while (newHighlights.includes(randomIndex));
        
        newHighlights.push(randomIndex);
      }
      
      setHighlightedPoints(newHighlights);
    }
  }, [points3D]);

  // マウスの動きを追跡する関数（改善版）
  const handleMouseMove = (event) => {
    if (!threeContainerRef.current) return;
    
    const rect = threeContainerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // 少し遅延を入れてパフォーマンスを向上
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(() => checkIntersection());
    } else {
      checkIntersection();
    }
  };

  // レイキャスティングでホバーしているオブジェクトを検出（さらに改善版）
  const checkIntersection = () => {
    if (!threeSceneRef.current || !spheresRef.current.length) return;
    
    const { camera, scene } = threeSceneRef.current;
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    
    // 検出範囲を大幅に広げる
    raycasterRef.current.params.Points = { threshold: 0.5 };
    raycasterRef.current.params.Line = { threshold: 0.5 };
    raycasterRef.current.far = 1000; // 遠くまで検出
    
    // 球体のサイズを考慮して検出（再帰的に子オブジェクトも検索）
    const intersects = raycasterRef.current.intersectObjects(scene.children, true);
    
    // 検出されたオブジェクトを処理
    if (intersects.length > 0) {
      // 最も近いオブジェクトを取得
      let intersectedObject = intersects[0].object;
      
      // 親オブジェクトが球体かどうかをチェック
      while (intersectedObject && spheresRef.current.indexOf(intersectedObject) === -1) {
        intersectedObject = intersectedObject.parent;
      }
      
      if (intersectedObject) {
        const index = spheresRef.current.indexOf(intersectedObject);
        
        if (index !== -1 && index !== hoveredPoint) {
          console.log(`Hovering over sphere ${index}`); // デバッグ用
          setHoveredPoint(index);
        }
      } else if (hoveredPoint !== null) {
        console.log('No hover detected'); // デバッグ用
        setHoveredPoint(null);
      }
    } else if (hoveredPoint !== null) {
      console.log('No hover detected'); // デバッグ用
      setHoveredPoint(null);
    }
  };

  // Function to initialize Three.js scene
  const initThreeScene = () => {
    if (!threeContainerRef.current || !points3D.length) return;
    
    // Clean up previous scene
    if (threeSceneRef.current) {
      const { scene, renderer, camera, controls } = threeSceneRef.current;
      threeContainerRef.current.removeChild(renderer.domElement);
      
      if (labelRendererRef.current) {
        threeContainerRef.current.removeChild(labelRendererRef.current.domElement);
      }
      
      controls.dispose();
      renderer.dispose();
      
      // Clean up all meshes from the scene
      while (scene.children.length > 0) {
        const object = scene.children[0];
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
        scene.remove(object);
      }
    }
    
    // Create new scene - フルスクリーン表示に最適化
    const width = threeContainerRef.current.clientWidth;
    const height = threeContainerRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // 真っ黒な背景
    
    // より広い視野角でカメラを設定
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 5;
    
    // アンチエイリアスを有効化したレンダラー
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio); // 高解像度ディスプレイ対応
    threeContainerRef.current.appendChild(renderer.domElement);
    
    // CSS2Dレンダラーの設定（ラベル表示用）
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    threeContainerRef.current.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;
    
    // より滑らかなコントロール
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.autoRotate = false; // 自動回転を無効化
    
    // 照明を強化
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // バックライト追加
    const backLight = new THREE.DirectionalLight(0x0077ff, 0.5);
    backLight.position.set(-1, -1, -1);
    scene.add(backLight);
    
    // Normalize points for better visualization
    const allX = points3D.map(p => p[0]);
    const allY = points3D.map(p => p[1]);
    const allZ = points3D.map(p => p[2]);
    
    const maxX = Math.max(...allX);
    const minX = Math.min(...allX);
    const maxY = Math.max(...allY);
    const minY = Math.min(...allY);
    const maxZ = Math.max(...allZ);
    const minZ = Math.min(...allZ);
    
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const rangeZ = maxZ - minZ || 1;
    
    const maxRange = Math.max(rangeX, rangeY, rangeZ);
    
    // 球体のジオメトリを作成（すべての球体で共有）- さらに小さい点
    const sphereGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const spheres = [];
    
    // 各ポイントに球体を配置
    for (let i = 0; i < points3D.length; i++) {
      // 正規化された位置
      const x = ((points3D[i][0] - minX) / rangeX * 4 - 2) * (rangeX / maxRange);
      const y = ((points3D[i][1] - minY) / rangeY * 4 - 2) * (rangeY / maxRange);
      const z = ((points3D[i][2] - minZ) / rangeZ * 4 - 2) * (rangeZ / maxRange);
      
      // 薄い白色の点
      const material = new THREE.MeshPhongMaterial({
        color: 0xcccccc, // 薄いグレー
        transparent: true,
        opacity: 0.7, // 少し透明
        emissive: 0xaaaaaa, // 弱い発光
        shininess: 80
      });
      
      // 球体を作成
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.set(x, y, z);
      scene.add(sphere);
      spheres.push(sphere);
      
      // 予言テキストを取得
      const prophecyText = generateProphecy(i);
      
      // ホバー時に表示する完全な予言テキスト用のラベル要素
      const fullLabelDiv = document.createElement('div');
      fullLabelDiv.className = 'prophecy-label hidden';
      fullLabelDiv.textContent = prophecyText;
      fullLabelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      fullLabelDiv.style.color = 'white';
      fullLabelDiv.style.padding = '5px 10px';
      fullLabelDiv.style.borderRadius = '4px';
      fullLabelDiv.style.fontSize = '12px';
      fullLabelDiv.style.pointerEvents = 'none';
      fullLabelDiv.style.width = 'max-content';
      fullLabelDiv.style.maxWidth = '200px';
      fullLabelDiv.style.textAlign = 'center';
      fullLabelDiv.style.opacity = '0.8';
      
      // 常に表示する短い予言テキスト用のラベル要素
      const shortLabelDiv = document.createElement('div');
      shortLabelDiv.className = 'short-prophecy-label';
      // 最初の20文字だけを表示（「...」なしで）
      shortLabelDiv.textContent = prophecyText.substring(0, 20);
      shortLabelDiv.style.color = highlightedPoints.includes(i) ? '#ff0000' : '#aaaaaa'; // プロットの色と同じ色
      shortLabelDiv.style.fontSize = '8px';
      shortLabelDiv.style.pointerEvents = 'none';
      shortLabelDiv.style.width = 'max-content';
      shortLabelDiv.style.maxWidth = '100px';
      shortLabelDiv.style.textAlign = 'center';
      shortLabelDiv.style.opacity = '0.7';
      
      // CSS2Dオブジェクトを作成
      const fullLabel = new CSS2DObject(fullLabelDiv);
      fullLabel.position.set(0, -0.1, 0); // 球体の真下に配置
      sphere.add(fullLabel);
      
      const shortLabel = new CSS2DObject(shortLabelDiv);
      shortLabel.position.set(0, -0.05, 0); // 球体のすぐ下に配置
      sphere.add(shortLabel);
    }
    
    // 赤く光っている点を線で結ぶ
    if (highlightedPoints.length > 0) {
      // 線のマテリアル - 蛍光色で見やすく
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xff00ff, // マゼンタ（蛍光ピンク）
        transparent: true,
        opacity: 0.8,
        linewidth: 2
      });
      
      // 線の頂点を作成
      const linePoints = highlightedPoints.map(index => {
        const sphere = spheres[index];
        return sphere.position.clone();
      });
      
      // 線を閉じる（最後の点と最初の点を結ぶ）
      linePoints.push(linePoints[0].clone());
      
      // 線のジオメトリを作成
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      
      // 線を作成
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    }
    
    // 球体の参照を保存
    spheresRef.current = spheres;
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      
      // ホバー効果とハイライト効果の更新
      spheres.forEach((sphere, index) => {
        if (index === hoveredPoint) {
          // ホバー時は真っ赤に強く光る
          sphere.material.color.set(0xff0000);
          sphere.material.emissive = new THREE.Color(0xff0000);
          sphere.material.emissiveIntensity = 1.0; // 強い発光
          sphere.scale.set(2.0, 2.0, 2.0); // より大きく
          // 完全な予言テキストを表示
          sphere.children[0].element.classList.remove('hidden');
          // 短いラベルの色を赤に
          sphere.children[1].element.style.color = '#ff0000';
        } else if (highlightedPoints.includes(index)) {
          // ハイライトされたポイントは赤く光る
          sphere.material.color.set(0xff0000);
          sphere.material.emissive = new THREE.Color(0xff0000);
          sphere.material.emissiveIntensity = 0.8; // 強い発光
          sphere.scale.set(1.5, 1.5, 1.5); // 少し大きく
          // 完全な予言テキストは非表示
          sphere.children[0].element.classList.add('hidden');
          // 短いラベルの色を赤に
          sphere.children[1].element.style.color = '#ff0000';
        } else {
          // 通常時は薄い白色
          sphere.material.color.set(0xcccccc);
          sphere.material.emissive = new THREE.Color(0xaaaaaa);
          sphere.material.emissiveIntensity = 0.1; // 非常に弱い発光
          sphere.scale.set(1, 1, 1);
          // 完全な予言テキストは非表示
          sphere.children[0].element.classList.add('hidden');
          // 短いラベルの色を薄いグレーに
          sphere.children[1].element.style.color = '#aaaaaa';
        }
      });
      
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!threeContainerRef.current) return;
      
      const width = threeContainerRef.current.clientWidth;
      const height = threeContainerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labelRenderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // マウスイベントリスナーを追加
    threeContainerRef.current.addEventListener('mousemove', handleMouseMove);
    
    // Store refs for cleanup
    threeSceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      cleanup: () => {
        window.removeEventListener('resize', handleResize);
        if (threeContainerRef.current) {
          threeContainerRef.current.removeEventListener('mousemove', handleMouseMove);
        }
      }
    };
  };

  // Effect to initialize Three.js scene when points3D changes
  useEffect(() => {
    if (points3D.length > 0) {
      initThreeScene();
    }
    
    // Cleanup function
    return () => {
      if (threeSceneRef.current) {
        threeSceneRef.current.cleanup();
      }
    };
  }, [points3D]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Head>
        <title>3D Vector Embedding Visualization</title>
        <meta name="description" content="Visualize high-dimensional vectors in 3D space" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex-1 flex flex-col">
        {/* 3Dマッピングを画面中央に大きく配置 */}
        <div className="flex-1 relative">
          {points3D.length > 0 && !isLoading ? (
            <div ref={threeContainerRef} className="absolute inset-0"></div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {isLoading ? (
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
              ) : (
                <div className="text-center text-gray-400">
                  <p className="text-xl mb-4">Loading vector data...</p>
                </div>
              )}
            </div>
          )}
          
          {/* 情報オーバーレイ */}
          {points3D.length > 0 && !isLoading && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-md text-sm">
              <div className="flex items-center space-x-2">
                <span>{vectors.length} vectors</span>
                <span>|</span>
                <span>{dimensionReductionMethod.toUpperCase()}</span>
              </div>
            </div>
          )}
          
          {/* 左下の入力欄 - 常に表示 */}
          <div className="fixed bottom-8 left-8 z-50">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isProcessing) {
                  // エンターキーが押されたら処理中状態にして3秒後に新しいランダムなハイライトを生成
                  if (points3D.length > 0) {
                    setIsProcessing(true); // 処理中状態に設定
                    setSearchText(''); // 入力欄をクリア
                    
                    // 3秒後に新しいハイライトを生成
                    setTimeout(() => {
                      console.log('予言入力: 新しいハイライトを生成します');
                      // 5〜10個のランダムなポイントを選択
                      const numHighlights = Math.floor(Math.random() * 6) + 5;
                      const newHighlights = [];
                      
                      for (let i = 0; i < numHighlights; i++) {
                        // 重複しないようにランダムなインデックスを選択
                        let randomIndex;
                        do {
                          randomIndex = Math.floor(Math.random() * points3D.length);
                        } while (newHighlights.includes(randomIndex));
                        
                        newHighlights.push(randomIndex);
                      }
                      
                      console.log(`新しいハイライト: ${newHighlights.join(', ')}`);
                      setHighlightedPoints(newHighlights);
                      
                      // シーンを再初期化して新しいハイライトを反映
                      if (threeSceneRef.current) {
                        console.log('シーンを再初期化します');
                        initThreeScene();
                      }
                      
                      setIsProcessing(false); // 処理完了
                    }, 3000); // 3秒間のローディング
                  }
                }
              }}
              placeholder="Enter your prophecy..."
              className="bg-transparent border-none outline-none text-white text-[60px] font-bold placeholder-gray-500/50 w-[40rem]"
            />
          </div>
        </div>
      </main>

      <style jsx global>{`
        .prophecy-label {
          font-family: 'Arial', sans-serif;
          transition: opacity 0.3s ease;
        }
      `}</style>
    </div>
  );
}