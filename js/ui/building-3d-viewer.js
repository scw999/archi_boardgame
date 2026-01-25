// 3D 건물 뷰어 모듈 (Three.js)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';

// 플레이어 색상
const PLAYER_COLORS = [
    0xef4444, // 빨강
    0x3b82f6, // 파랑
    0x22c55e, // 초록
    0xa855f7  // 보라
];

// GLB 모델 경로 설정 (사용자가 GLB 파일을 추가하면 여기에 경로 설정)
// null이면 절차적 모델 사용, 문자열 경로면 GLB 로드
export const BUILDING_GLB_MODELS = {
    '단독주택': 'assets/models/house.glb',
    '전원주택': 'assets/models/country-house.glb',
    '상가주택': 'assets/models/mixed-use.glb',
    '카페': 'assets/models/cafe.glb',
    '풀빌라': 'assets/models/pool-villa.glb',
    '호텔': 'assets/models/hotel.glb',
    '대형카페': 'assets/models/large-cafe.glb',
    '상가': 'assets/models/store.glb',
    '복합몰': 'assets/models/mall.glb',
    '펜션': 'assets/models/pension.glb',
    '대형빌딩': 'assets/models/skyscraper.glb'
};

// 건물 타입별 3D 설정
const BUILDING_3D_CONFIG = {
    '단독주택': {
        floors: 2,
        width: 8,
        depth: 10,
        roofType: 'gable',
        roofColor: 0x8b4513,
        wallColor: 0xfaf0e6,
        hasGarden: true,
        glbScale: 30,
        glbHeight: 60
    },
    '전원주택': {
        floors: 2,
        width: 12,
        depth: 14,
        roofType: 'gable',
        roofColor: 0x654321,
        wallColor: 0xf5deb3,
        hasGarden: true,
        hasPorch: true,
        glbScale: 30,
        glbHeight: 60
    },
    '상가주택': {
        floors: 4,
        width: 10,
        depth: 12,
        roofType: 'flat',
        roofColor: 0x555555,
        wallColor: 0xe8e8e8,
        hasStorefront: true,
        glbScale: 36,
        glbHeight: 108
    },
    '카페': {
        floors: 1,
        width: 10,
        depth: 8,
        roofType: 'flat',
        roofColor: 0x8b4513,
        wallColor: 0xdaa520,
        hasAwning: true,
        hasTerrace: true,
        glbScale: 30,
        glbHeight: 30
    },
    '풀빌라': {
        floors: 2,
        width: 14,
        depth: 12,
        roofType: 'flat',
        roofColor: 0xffffff,
        wallColor: 0xffffff,
        hasPool: true,
        modern: true,
        glbScale: 36,
        glbHeight: 60
    },
    '호텔': {
        floors: 8,
        width: 20,
        depth: 16,
        roofType: 'flat',
        roofColor: 0x333333,
        wallColor: 0x87ceeb,
        hasEntrance: true,
        hasBalconies: true,
        glbScale: 45,
        glbHeight: 216
    },
    '대형카페': {
        floors: 2,
        width: 16,
        depth: 14,
        roofType: 'curved',
        roofColor: 0x8b4513,
        wallColor: 0xf4a460,
        hasAwning: true,
        hasTerrace: true,
        glbScale: 36,
        glbHeight: 54
    },
    '상가': {
        floors: 5,
        width: 14,
        depth: 12,
        roofType: 'flat',
        roofColor: 0x444444,
        wallColor: 0xd3d3d3,
        hasStorefront: true,
        hasSigns: true,
        glbScale: 36,
        glbHeight: 135
    },
    '복합몰': {
        floors: 4,
        width: 30,
        depth: 25,
        roofType: 'flat',
        roofColor: 0x222222,
        wallColor: 0x4169e1,
        hasGlassFacade: true,
        hasEntrance: true,
        glbScale: 45,
        glbHeight: 108
    },
    '펜션': {
        floors: 2,
        width: 8,
        depth: 8,
        roofType: 'gable',
        roofColor: 0x2f4f4f,
        wallColor: 0xdeb887,
        hasGarden: true,
        cabinStyle: true,
        glbScale: 30,
        glbHeight: 54
    },
    '대형빌딩': {
        floors: 15,
        width: 18,
        depth: 18,
        roofType: 'flat',
        roofColor: 0x1a1a1a,
        wallColor: 0x4682b4,
        hasGlassFacade: true,
        hasHelipad: true,
        glbScale: 45,
        glbHeight: 405
    }
};

// 3D 뷰어 클래스
export class Building3DViewer {
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.getElementById(container)
            : container;

        if (!this.container) {
            console.error('3D Viewer container not found');
            return;
        }

        this.options = {
            width: options.width || this.container.clientWidth || 400,
            height: options.height || this.container.clientHeight || 300,
            backgroundColor: options.backgroundColor || 0x87ceeb,
            enableControls: options.enableControls !== false,
            autoRotate: options.autoRotate || false,
            ...options
        };

        this.buildings = [];
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;

        // GLB 로더 초기화
        this.gltfLoader = new GLTFLoader();

        // DRACO 압축 지원 (선택적)
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        this.gltfLoader.setDRACOLoader(dracoLoader);

        // 로드된 GLB 모델 캐시
        this.modelCache = new Map();

        this.init();
    }

    init() {
        // Scene 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);

        // Camera 설정 (near 값을 높여 z-fighting 방지)
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.options.width / this.options.height,
            1,
            2000
        );
        this.camera.position.set(50, 40, 50);
        this.camera.lookAt(0, 0, 0);

        // Renderer 생성 (logarithmicDepthBuffer로 z-fighting 방지)
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            logarithmicDepthBuffer: true
        });
        this.renderer.setSize(this.options.width, this.options.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        if (this.options.enableControls) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2.1;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 600;
            this.controls.autoRotate = this.options.autoRotate;
            this.controls.autoRotateSpeed = 0.5;
        }

        // 조명 설정
        this.setupLighting();

        // 지면 생성
        this.createGround();

        // 리사이즈 이벤트
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

        // 애니메이션 시작
        this.animate();
    }

    setupLighting() {
        // 환경광
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 태양광 (그림자) - 확장된 영역에 맞게 조정
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(100, 150, 100);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -300;
        sunLight.shadow.camera.right = 300;
        sunLight.shadow.camera.top = 300;
        sunLight.shadow.camera.bottom = -300;
        this.scene.add(sunLight);

        // 보조 조명
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-20, 30, -20);
        this.scene.add(fillLight);
    }

    createGround() {
        // 지면 (두꺼운 박스로 z-fighting 방지)
        const groundGeometry = new THREE.BoxGeometry(550, 2, 550);
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x7cfc00
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = -1; // 박스 중심이 -1이므로 상단이 0
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 도로 (십자 형태) - 두꺼운 박스로 변경
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

        const roadH = new THREE.Mesh(
            new THREE.BoxGeometry(550, 0.5, 12),
            roadMaterial
        );
        roadH.position.y = 0.25;
        this.scene.add(roadH);

        const roadV = new THREE.Mesh(
            new THREE.BoxGeometry(12, 0.5, 550),
            roadMaterial
        );
        roadV.position.y = 0.25;
        this.scene.add(roadV);
    }

    // 건물 생성 (GLB 또는 절차적 모델)
    createBuilding(buildingType, position = { x: 0, z: 0 }, playerIndex = 0, status = 'completed') {
        const config = BUILDING_3D_CONFIG[buildingType];
        if (!config) {
            console.warn(`Unknown building type: ${buildingType}`);
            return null;
        }

        const glbPath = BUILDING_GLB_MODELS[buildingType];

        // GLB 파일이 설정되어 있으면 GLB 로드
        if (glbPath) {
            return this.createBuildingFromGLB(buildingType, glbPath, position, playerIndex, status);
        }

        // 아니면 절차적 모델 생성
        return this.createProceduralBuilding(buildingType, position, playerIndex, status);
    }

    // GLB 파일에서 건물 로드
    async createBuildingFromGLB(buildingType, glbPath, position, playerIndex, status) {
        const config = BUILDING_3D_CONFIG[buildingType];
        const buildingGroup = new THREE.Group();
        buildingGroup.userData = { buildingType, playerIndex, status, isGLB: true };

        try {
            let gltf;

            // 캐시 확인
            if (this.modelCache.has(glbPath)) {
                gltf = this.modelCache.get(glbPath);
            } else {
                gltf = await this.loadGLBModel(glbPath);
                this.modelCache.set(glbPath, gltf);
            }

            // 모델 복제
            const model = gltf.scene.clone();

            // 모델 스케일 및 위치 조정
            const scale = config.glbScale || 1;
            model.scale.set(scale, scale, scale);

            // 모델 회전 (필요시)
            if (config.glbRotation) {
                model.rotation.y = config.glbRotation;
            }

            // 바운딩 박스 계산하여 지면 위에 배치
            const box = new THREE.Box3().setFromObject(model);
            const minY = box.min.y;
            if (minY < 0) {
                model.position.y = -minY; // 지면 위로 올림
            }

            // 그림자 설정
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // 설계/시공 중 투명도 적용
                    if (status === 'design' || status === 'construction') {
                        if (child.material) {
                            child.material = child.material.clone();
                            child.material.transparent = true;
                            child.material.opacity = 0.5;
                        }
                    }
                }
            });

            buildingGroup.add(model);

            // 실제 높이 재계산
            const finalBox = new THREE.Box3().setFromObject(buildingGroup);
            const totalHeight = finalBox.max.y - finalBox.min.y;

            // 플레이어 깃발 추가 (매각된 건물은 제외)
            if (status !== 'sold') {
                this.addPlayerFlag(buildingGroup, playerIndex, totalHeight);
            }

            // 상태 라벨 추가 (설계중/시공중/시공완료)
            if (status === 'design' || status === 'construction' || status === 'constructionComplete') {
                this.addStatusLabel(buildingGroup, status, totalHeight);
            }

            // 시공 중 크레인 추가
            if (status === 'construction') {
                this.addConstructionElements(buildingGroup, totalHeight);
            }

        } catch (error) {
            console.warn(`Failed to load GLB model for ${buildingType}, using procedural model:`, error);
            // GLB 로드 실패 시 절차적 모델로 폴백
            return this.createProceduralBuilding(buildingType, position, playerIndex, status);
        }

        // 위치 설정
        buildingGroup.position.set(position.x, 0, position.z);

        this.scene.add(buildingGroup);
        this.buildings.push(buildingGroup);

        return buildingGroup;
    }

    // GLB 모델 로드 (Promise 기반)
    loadGLBModel(path) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => resolve(gltf),
                (progress) => {
                    // 로딩 진행률 (선택적)
                    // console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
                },
                (error) => reject(error)
            );
        });
    }

    // 커스텀 GLB 모델 설정
    setGLBModel(buildingType, glbPath, options = {}) {
        if (BUILDING_3D_CONFIG[buildingType]) {
            BUILDING_GLB_MODELS[buildingType] = glbPath;

            // 추가 옵션 설정
            if (options.scale) {
                BUILDING_3D_CONFIG[buildingType].glbScale = options.scale;
            }
            if (options.rotation) {
                BUILDING_3D_CONFIG[buildingType].glbRotation = options.rotation;
            }
            if (options.height) {
                BUILDING_3D_CONFIG[buildingType].glbHeight = options.height;
            }

            // 캐시 무효화
            this.modelCache.delete(glbPath);

            return true;
        }
        return false;
    }

    // 절차적 건물 모델 생성
    createProceduralBuilding(buildingType, position = { x: 0, z: 0 }, playerIndex = 0, status = 'completed') {
        const config = BUILDING_3D_CONFIG[buildingType];

        const buildingGroup = new THREE.Group();
        buildingGroup.userData = { buildingType, playerIndex, status, isGLB: false };

        const floorHeight = 3;
        const totalHeight = config.floors * floorHeight;

        // 투명도 설정 (설계/시공 중)
        const opacity = (status === 'design' || status === 'construction') ? 0.5 : 1;
        const transparent = opacity < 1;

        // 벽면 재질
        const wallMaterial = new THREE.MeshLambertMaterial({
            color: config.wallColor,
            transparent,
            opacity
        });

        // 유리 건물인 경우
        if (config.hasGlassFacade) {
            wallMaterial.color = new THREE.Color(config.wallColor);
            wallMaterial.transparent = true;
            wallMaterial.opacity = Math.min(opacity, 0.7);
        }

        // 건물 본체
        const bodyGeometry = new THREE.BoxGeometry(config.width, totalHeight, config.depth);
        const body = new THREE.Mesh(bodyGeometry, wallMaterial);
        body.position.y = totalHeight / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        buildingGroup.add(body);

        // 창문 추가
        this.addWindows(buildingGroup, config, floorHeight, opacity);

        // 지붕 추가
        this.addRoof(buildingGroup, config, totalHeight, opacity);

        // 특수 요소 추가
        if (config.hasPool) this.addPool(buildingGroup, config);
        if (config.hasGarden) this.addGarden(buildingGroup, config);
        if (config.hasTerrace) this.addTerrace(buildingGroup, config);
        if (config.hasAwning) this.addAwning(buildingGroup, config);
        if (config.hasEntrance) this.addEntrance(buildingGroup, config, totalHeight);
        if (config.hasHelipad) this.addHelipad(buildingGroup, config, totalHeight);

        // 플레이어 색상 표시 (깃발) - 매각 건물은 제외
        if (status !== 'sold') {
            this.addPlayerFlag(buildingGroup, playerIndex, totalHeight);
        }

        // 상태 라벨 추가 (설계중/시공중/시공완료)
        if (status === 'design' || status === 'construction' || status === 'constructionComplete') {
            this.addStatusLabel(buildingGroup, status, totalHeight);
        }

        // 시공 중 크레인 표시
        if (status === 'construction') {
            this.addConstructionElements(buildingGroup, totalHeight);
        }

        // 위치 설정
        buildingGroup.position.set(position.x, 0, position.z);

        this.scene.add(buildingGroup);
        this.buildings.push(buildingGroup);

        return buildingGroup;
    }

    addWindows(buildingGroup, config, floorHeight, opacity) {
        const windowMaterial = new THREE.MeshLambertMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: Math.min(opacity, 0.7)
        });

        const windowWidth = 1.5;
        const windowHeight = 2;
        const windowDepth = 0.1;

        for (let floor = 0; floor < config.floors; floor++) {
            const windowY = floor * floorHeight + floorHeight * 0.6;
            const windowsPerSide = Math.floor(config.width / 3);

            for (let i = 0; i < windowsPerSide; i++) {
                const windowX = -config.width / 2 + 2 + i * 3;

                // 앞면 창문
                const windowFront = new THREE.Mesh(
                    new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
                    windowMaterial
                );
                windowFront.position.set(windowX, windowY, config.depth / 2 + 0.05);
                buildingGroup.add(windowFront);

                // 뒷면 창문
                const windowBack = windowFront.clone();
                windowBack.position.z = -config.depth / 2 - 0.05;
                buildingGroup.add(windowBack);
            }

            // 측면 창문
            const sideWindowsCount = Math.floor(config.depth / 3);
            for (let i = 0; i < sideWindowsCount; i++) {
                const windowZ = -config.depth / 2 + 2 + i * 3;

                const windowRight = new THREE.Mesh(
                    new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth),
                    windowMaterial
                );
                windowRight.position.set(config.width / 2 + 0.05, windowY, windowZ);
                buildingGroup.add(windowRight);

                const windowLeft = windowRight.clone();
                windowLeft.position.x = -config.width / 2 - 0.05;
                buildingGroup.add(windowLeft);
            }
        }
    }

    addRoof(buildingGroup, config, totalHeight, opacity) {
        const roofMaterial = new THREE.MeshLambertMaterial({
            color: config.roofColor,
            transparent: opacity < 1,
            opacity
        });

        if (config.roofType === 'gable') {
            // 삼각 지붕
            const roofGeometry = new THREE.ConeGeometry(
                Math.max(config.width, config.depth) * 0.7,
                4,
                4
            );
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = totalHeight + 2;
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            buildingGroup.add(roof);
        } else if (config.roofType === 'curved') {
            // 곡면 지붕
            const roofGeometry = new THREE.SphereGeometry(
                config.width / 2,
                16,
                8,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
            );
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = totalHeight;
            roof.scale.set(1, 0.3, config.depth / config.width);
            roof.castShadow = true;
            buildingGroup.add(roof);
        } else {
            // 평지붕
            const roofGeometry = new THREE.BoxGeometry(
                config.width + 1,
                0.5,
                config.depth + 1
            );
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = totalHeight + 0.25;
            roof.castShadow = true;
            buildingGroup.add(roof);
        }
    }

    addPool(buildingGroup, config) {
        const poolMaterial = new THREE.MeshLambertMaterial({
            color: 0x00bfff,
            transparent: true,
            opacity: 0.8
        });
        const poolGeometry = new THREE.BoxGeometry(8, 0.5, 4);
        const pool = new THREE.Mesh(poolGeometry, poolMaterial);
        pool.position.set(0, 0.25, config.depth / 2 + 4);
        buildingGroup.add(pool);

        // 풀 테두리
        const borderMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const borderGeometry = new THREE.BoxGeometry(9, 0.3, 0.3);
        const border1 = new THREE.Mesh(borderGeometry, borderMaterial);
        border1.position.set(0, 0.5, config.depth / 2 + 2);
        buildingGroup.add(border1);
        const border2 = border1.clone();
        border2.position.z = config.depth / 2 + 6;
        buildingGroup.add(border2);
    }

    addGarden(buildingGroup, config) {
        // 나무 추가
        const treePositions = [
            { x: -config.width / 2 - 3, z: -config.depth / 2 - 3 },
            { x: config.width / 2 + 3, z: -config.depth / 2 - 3 },
            { x: -config.width / 2 - 3, z: config.depth / 2 + 3 }
        ];

        treePositions.forEach(pos => {
            const tree = this.createTree();
            tree.position.set(pos.x, 0, pos.z);
            buildingGroup.add(tree);
        });
    }

    createTree() {
        const treeGroup = new THREE.Group();

        // 줄기
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // 잎
        const leavesGeometry = new THREE.SphereGeometry(2, 8, 6);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 4;
        leaves.castShadow = true;
        treeGroup.add(leaves);

        return treeGroup;
    }

    addTerrace(buildingGroup, config) {
        const terraceMaterial = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
        const terraceGeometry = new THREE.BoxGeometry(config.width + 4, 0.2, 4);
        const terrace = new THREE.Mesh(terraceGeometry, terraceMaterial);
        terrace.position.set(0, 0.1, config.depth / 2 + 2);
        terrace.receiveShadow = true;
        buildingGroup.add(terrace);

        // 테이블과 의자
        const tableMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const tableGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16);
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(-2, 0.8, config.depth / 2 + 2);
        buildingGroup.add(table);

        // 파라솔
        const umbrellaGeometry = new THREE.ConeGeometry(1.5, 0.5, 8);
        const umbrellaMaterial = new THREE.MeshLambertMaterial({ color: 0xff6347 });
        const umbrella = new THREE.Mesh(umbrellaGeometry, umbrellaMaterial);
        umbrella.position.set(-2, 2.5, config.depth / 2 + 2);
        umbrella.rotation.x = Math.PI;
        buildingGroup.add(umbrella);
    }

    addAwning(buildingGroup, config) {
        const awningMaterial = new THREE.MeshLambertMaterial({
            color: 0xff4500,
            side: THREE.DoubleSide
        });
        const awningGeometry = new THREE.BoxGeometry(config.width, 0.1, 2);
        const awning = new THREE.Mesh(awningGeometry, awningMaterial);
        awning.position.set(0, 3, config.depth / 2 + 1);
        awning.rotation.x = -0.2;
        buildingGroup.add(awning);
    }

    addEntrance(buildingGroup, config, totalHeight) {
        // 입구 캐노피
        const canopyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const canopyGeometry = new THREE.BoxGeometry(6, 0.2, 4);
        const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
        canopy.position.set(0, 4, config.depth / 2 + 2);
        buildingGroup.add(canopy);

        // 기둥
        const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);

        const pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar1.position.set(-2.5, 2, config.depth / 2 + 3.5);
        buildingGroup.add(pillar1);

        const pillar2 = pillar1.clone();
        pillar2.position.x = 2.5;
        buildingGroup.add(pillar2);
    }

    addHelipad(buildingGroup, config, totalHeight) {
        const helipadMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const helipadGeometry = new THREE.CylinderGeometry(4, 4, 0.2, 32);
        const helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
        helipad.position.y = totalHeight + 0.6;
        buildingGroup.add(helipad);

        // H 표시
        const hMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const hGeometry = new THREE.BoxGeometry(2, 0.1, 0.3);
        const hBar = new THREE.Mesh(hGeometry, hMaterial);
        hBar.position.y = totalHeight + 0.75;
        buildingGroup.add(hBar);
    }

    addPlayerFlag(buildingGroup, playerIndex, totalHeight) {
        const flagGroup = new THREE.Group();

        // 깃대 (더 크게)
        const poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 25, 8);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 12.5;
        flagGroup.add(pole);

        // 깃발 (더 크게)
        const flagGeometry = new THREE.PlaneGeometry(15, 10);
        const flagMaterial = new THREE.MeshLambertMaterial({
            color: PLAYER_COLORS[playerIndex] || 0xffffff,
            side: THREE.DoubleSide
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(8, 20, 0);
        flagGroup.add(flag);

        // 깃발 테두리
        const borderGeometry = new THREE.EdgesGeometry(flagGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.position.set(8, 20, 0);
        flagGroup.add(border);

        flagGroup.position.set(0, totalHeight, 0);
        buildingGroup.add(flagGroup);
    }

    // 상태 라벨 추가 (설계중/설계 완료)
    addStatusLabel(buildingGroup, status, totalHeight) {
        const labelGroup = new THREE.Group();

        // 3배 크기로 확대 (사용자 요청)
        const scale = 3;

        // 상태별 텍스트와 색상 설정
        let labelText, bgColor, iconEmoji;
        if (status === 'design') {
            labelText = '설계중';
            bgColor = 0x3b82f6; // 파랑
            iconEmoji = '📐';
        } else if (status === 'construction') {
            labelText = '설계완료';
            bgColor = 0x22c55e; // 초록
            iconEmoji = '✅';
        } else if (status === 'constructionComplete') {
            labelText = '시공완료';
            bgColor = 0xf97316; // 오렌지
            iconEmoji = '🏢';
        } else {
            return; // 알 수 없는 상태는 라벨 표시 안함
        }

        // 라벨 배경 (3배 크기)
        const labelWidth = 14 * scale;
        const labelHeight = 4 * scale;
        const bgGeometry = new THREE.PlaneGeometry(labelWidth, labelHeight);
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: bgColor,
            side: THREE.DoubleSide,
            depthWrite: false // z-fighting 방지
        });
        const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
        bgMesh.renderOrder = 1; // z-fighting 방지
        labelGroup.add(bgMesh);

        // 테두리
        const borderGeometry = new THREE.EdgesGeometry(bgGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.renderOrder = 2;
        labelGroup.add(border);

        // 텍스트 대신 아이콘으로 표시 (3배 크기)
        const iconGeometry = new THREE.PlaneGeometry(3 * scale, 3 * scale);
        const iconCanvas = document.createElement('canvas');
        iconCanvas.width = 256;
        iconCanvas.height = 256;
        const ctx = iconCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.font = 'bold 160px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(iconEmoji, 128, 128);

        const iconTexture = new THREE.CanvasTexture(iconCanvas);
        const iconMaterial = new THREE.MeshBasicMaterial({
            map: iconTexture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
        iconMesh.position.x = -labelWidth / 2 + 5 * scale;
        iconMesh.position.z = 0.1; // z-fighting 방지
        iconMesh.renderOrder = 3;
        labelGroup.add(iconMesh);

        // 한글 텍스트 (3배 크기)
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 512;
        textCanvas.height = 128;
        const textCtx = textCanvas.getContext('2d');
        textCtx.fillStyle = 'white';
        textCtx.font = 'bold 80px sans-serif';
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'middle';
        textCtx.fillText(labelText, 256, 64);

        const textTexture = new THREE.CanvasTexture(textCanvas);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const textGeometry = new THREE.PlaneGeometry(8 * scale, 2 * scale);
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.x = 3 * scale;
        textMesh.position.z = 0.1; // z-fighting 방지
        textMesh.renderOrder = 3;
        labelGroup.add(textMesh);

        // 라벨 위치 설정 - 건물 가운데, 깃발 바로 위
        labelGroup.position.set(0, totalHeight + 32, 0);

        // 카메라를 향하도록 설정 (빌보드)
        labelGroup.userData.isBillboard = true;
        this.billboards = this.billboards || [];
        this.billboards.push(labelGroup);

        buildingGroup.add(labelGroup);
    }

    addConstructionElements(buildingGroup, totalHeight) {
        // 크레인
        const craneGroup = new THREE.Group();

        const craneMaterial = new THREE.MeshLambertMaterial({ color: 0xffa500 });

        // 크레인 기둥
        const craneBase = new THREE.Mesh(
            new THREE.BoxGeometry(1, totalHeight + 10, 1),
            craneMaterial
        );
        craneBase.position.y = (totalHeight + 10) / 2;
        craneGroup.add(craneBase);

        // 크레인 팔
        const craneArm = new THREE.Mesh(
            new THREE.BoxGeometry(15, 0.5, 0.5),
            craneMaterial
        );
        craneArm.position.set(7, totalHeight + 10, 0);
        craneGroup.add(craneArm);

        craneGroup.position.set(-15, 0, 0);
        buildingGroup.add(craneGroup);
    }

    // 건물 제거
    removeBuilding(building) {
        const index = this.buildings.indexOf(building);
        if (index > -1) {
            this.scene.remove(building);
            this.buildings.splice(index, 1);
        }
    }

    // 모든 건물 제거
    clearBuildings() {
        this.buildings.forEach(building => {
            this.scene.remove(building);
        });
        this.buildings = [];
    }

    // 여러 건물 표시 (4등분 플레이어별 배치)
    async displayBuildings(buildingDataList) {
        this.clearBuildings();
        this.billboards = []; // 빌보드 초기화

        // 플레이어별로 건물 그룹화
        const playerBuildings = [[], [], [], []];
        buildingDataList.forEach(data => {
            const playerIdx = data.playerIndex || 0;
            if (playerIdx >= 0 && playerIdx < 4) {
                playerBuildings[playerIdx].push(data);
            }
        });

        // 4등분 영역 중심점 (플레이어별) - 녹색 영역에 맞게 확장
        const quadrantCenters = [
            { x: -120, z: -120 },  // 플레이어 0: 좌상단
            { x: 120, z: -120 },   // 플레이어 1: 우상단
            { x: -120, z: 120 },   // 플레이어 2: 좌하단
            { x: 120, z: 120 }     // 플레이어 3: 우하단
        ];

        const spacing = 80;
        const promises = [];

        playerBuildings.forEach((buildings, playerIdx) => {
            const center = quadrantCenters[playerIdx];
            const count = buildings.length;

            if (count === 0) return;

            // 건물 개수에 따라 그리드 크기 계산
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);

            buildings.forEach((data, index) => {
                const row = Math.floor(index / cols);
                const col = index % cols;

                // 중앙 정렬
                const offsetX = (col - (cols - 1) / 2) * spacing;
                const offsetZ = (row - (rows - 1) / 2) * spacing;

                const position = {
                    x: center.x + offsetX,
                    z: center.z + offsetZ
                };

                promises.push(
                    this.createBuilding(
                        data.buildingType,
                        position,
                        data.playerIndex || 0,
                        data.status || 'completed'
                    )
                );
            });
        });

        await Promise.all(promises);

        // 플레이어 영역 표시 (바닥에 색상)
        this.addPlayerZones();

        // 카메라 위치 조정 (확장된 영역에 맞게)
        this.camera.position.set(350, 280, 350);
        this.camera.lookAt(0, 0, 0);
    }

    // 플레이어 영역 표시
    addPlayerZones() {
        const zoneSize = 220;
        const quadrants = [
            { x: -120, z: -120, color: PLAYER_COLORS[0] },
            { x: 120, z: -120, color: PLAYER_COLORS[1] },
            { x: -120, z: 120, color: PLAYER_COLORS[2] },
            { x: 120, z: 120, color: PLAYER_COLORS[3] }
        ];

        quadrants.forEach(q => {
            const zoneGeometry = new THREE.PlaneGeometry(zoneSize, zoneSize);
            const zoneMaterial = new THREE.MeshLambertMaterial({
                color: q.color,
                transparent: true,
                opacity: 0.25,
                side: THREE.DoubleSide,
                depthWrite: false // 투명 객체 z-fighting 방지
            });
            const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
            zone.rotation.x = -Math.PI / 2;
            zone.position.set(q.x, 0.1, q.z);
            zone.renderOrder = 1; // 렌더 순서 지정
            this.scene.add(zone);

            // 영역 테두리 (3D 박스로 변경하여 더 잘 보이게)
            const borderThickness = 1;
            const borderMaterial = new THREE.MeshBasicMaterial({
                color: q.color,
                transparent: true,
                opacity: 0.8
            });

            // 상단 테두리
            const borderTop = new THREE.Mesh(
                new THREE.BoxGeometry(zoneSize, 0.5, borderThickness),
                borderMaterial
            );
            borderTop.position.set(q.x, 0.3, q.z - zoneSize/2);
            this.scene.add(borderTop);

            // 하단 테두리
            const borderBottom = new THREE.Mesh(
                new THREE.BoxGeometry(zoneSize, 0.5, borderThickness),
                borderMaterial
            );
            borderBottom.position.set(q.x, 0.3, q.z + zoneSize/2);
            this.scene.add(borderBottom);

            // 좌측 테두리
            const borderLeft = new THREE.Mesh(
                new THREE.BoxGeometry(borderThickness, 0.5, zoneSize),
                borderMaterial
            );
            borderLeft.position.set(q.x - zoneSize/2, 0.3, q.z);
            this.scene.add(borderLeft);

            // 우측 테두리
            const borderRight = new THREE.Mesh(
                new THREE.BoxGeometry(borderThickness, 0.5, zoneSize),
                borderMaterial
            );
            borderRight.position.set(q.x + zoneSize/2, 0.3, q.z);
            this.scene.add(borderRight);
        });
    }

    // 단일 건물 상세 뷰
    async focusOnBuilding(buildingType, playerIndex = 0, status = 'completed') {
        this.clearBuildings();
        await this.createBuilding(buildingType, { x: 0, z: 0 }, playerIndex, status);

        // 카메라를 건물에 맞춤
        const config = BUILDING_3D_CONFIG[buildingType];
        if (config) {
            const height = config.glbHeight || config.floors * 3;
            const distance = Math.max(config.width, config.depth, height) * 1.2;
            this.camera.position.set(distance, distance * 0.6, distance);
            this.camera.lookAt(0, height / 3, 0);
        }
    }

    handleResize() {
        if (!this.container) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        // 빌보드 업데이트 (라벨이 항상 카메라를 향하도록)
        if (this.billboards && this.billboards.length > 0) {
            this.billboards.forEach(billboard => {
                if (billboard.parent) {
                    billboard.lookAt(this.camera.position);
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    // 자동 회전 토글
    toggleAutoRotate() {
        if (this.controls) {
            this.controls.autoRotate = !this.controls.autoRotate;
            return this.controls.autoRotate;
        }
        return false;
    }

    // 정리
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        window.removeEventListener('resize', this.handleResize);

        if (this.controls) {
            this.controls.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }

        this.buildings = [];
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }
}

// 건물 상세 모달용 3D 뷰어 생성
export function create3DViewerModal(buildingType, playerIndex = 0, onClose = null) {
    // 기존 모달 제거
    const existingModal = document.querySelector('.building-3d-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'building-3d-modal';
    modal.innerHTML = `
        <div class="modal-3d-content">
            <div class="modal-3d-header">
                <h3>${buildingType} - 3D 뷰</h3>
                <div class="modal-3d-controls">
                    <button id="btn-3d-rotate" title="자동 회전">🔄</button>
                    <button id="btn-3d-close" title="닫기">✕</button>
                </div>
            </div>
            <div id="building-3d-container" class="building-3d-container"></div>
            <div class="modal-3d-info">
                <p>마우스로 드래그하여 회전, 스크롤로 확대/축소</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 스타일 추가
    addModal3DStyles();

    // 3D 뷰어 초기화
    const container = document.getElementById('building-3d-container');
    const viewer = new Building3DViewer(container, {
        width: container.clientWidth,
        height: 400,
        autoRotate: true
    });

    viewer.focusOnBuilding(buildingType, playerIndex);

    // 이벤트 바인딩
    document.getElementById('btn-3d-rotate').addEventListener('click', () => {
        const isRotating = viewer.toggleAutoRotate();
        document.getElementById('btn-3d-rotate').textContent = isRotating ? '⏸️' : '🔄';
    });

    const closeModal = () => {
        viewer.dispose();
        modal.remove();
        if (onClose) onClose();
    };

    document.getElementById('btn-3d-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    return viewer;
}

// 모달 스타일 추가
function addModal3DStyles() {
    if (document.getElementById('modal-3d-styles')) return;

    const style = document.createElement('style');
    style.id = 'modal-3d-styles';
    style.textContent = `
        .building-3d-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        .modal-3d-content {
            background: #1a1a2e;
            border-radius: 12px;
            overflow: hidden;
            width: 90%;
            max-width: 700px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .modal-3d-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .modal-3d-header h3 {
            margin: 0;
            font-size: 1.2rem;
        }
        .modal-3d-controls {
            display: flex;
            gap: 10px;
        }
        .modal-3d-controls button {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            transition: background 0.2s;
        }
        .modal-3d-controls button:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        .building-3d-container {
            width: 100%;
            height: 400px;
            background: #87ceeb;
        }
        .modal-3d-info {
            padding: 10px 20px;
            text-align: center;
            color: #888;
            font-size: 0.85rem;
            background: #0f0f1a;
        }
    `;
    document.head.appendChild(style);
}

// 전역 뷰어 인스턴스
let globalViewer = null;

// 전역 3D 도시 뷰 초기화
export function initCityView3D(containerId) {
    if (globalViewer) {
        globalViewer.dispose();
    }

    const container = document.getElementById(containerId);
    if (!container) return null;

    globalViewer = new Building3DViewer(container, {
        backgroundColor: 0x87ceeb,
        autoRotate: false
    });

    return globalViewer;
}

// 전역 뷰어 가져오기
export function getGlobalViewer() {
    return globalViewer;
}

export { BUILDING_3D_CONFIG, PLAYER_COLORS as PLAYER_3D_COLORS };
