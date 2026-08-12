# ADHD 코칭 AI 파인튜닝 가이드

ADHD 전문 코칭 AI 모델을 만들기 위한 데이터 준비 및 학습 파이프라인입니다.

## 전체 워크플로우

```
1. 데이터 수집          2. 텍스트 추출          3. 학습 데이터 생성      4. 모델 파인튜닝
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ PDF 논문    │       │             │       │ Q&A 쌍      │       │ SFT 학습    │
│ 텍스트 파일 │  ───► │ 텍스트 청크 │  ───► │ 선호도 쌍   │  ───► │ DPO 학습    │
│ 코칭 로그   │       │             │       │ (AI 생성)   │       │             │
└─────────────┘       └─────────────┘       └─────────────┘       └─────────────┘
```

## 1단계: 환경 설정

```bash
# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 기본 패키지 설치
pip install -r requirements.txt
```

## 2단계: 데이터 추출

PDF 논문과 텍스트 파일에서 텍스트를 추출합니다.

```bash
# 예시: adhd_data 폴더의 파일들을 처리
python extract_data.py --input ./adhd_data --output ./output

# 결과물
# ./output/extracted_chunks.json
```

**지원 형식:**
- PDF 파일 (*.pdf)
- 텍스트 파일 (*.txt)

**폴더 구조 예시:**
```
adhd_data/
├── 논문/
│   ├── adhd_executive_function.pdf
│   └── adhd_coaching_strategies.pdf
├── 교육자료/
│   └── adhd_guide.txt
└── 코칭로그/
    └── session_notes.txt
```

## 3단계: 학습 데이터 생성

추출된 텍스트로부터 AI(Claude/GPT)를 사용해 학습 데이터를 생성합니다.

```bash
# API 키 설정
export ANTHROPIC_API_KEY="your-key"
# 또는
export OPENAI_API_KEY="your-key"

# 학습 데이터 생성 (Q&A + 선호도)
python generate_training_data.py \
    --chunks ./output/extracted_chunks.json \
    --output ./output \
    --type both \
    --provider anthropic

# 테스트: 5개 청크만 처리
python generate_training_data.py \
    --chunks ./output/extracted_chunks.json \
    --output ./output \
    --max-chunks 5
```

**결과물:**
- `sft_dataset.json` - SFT 학습용 (instruction-response)
- `dpo_dataset.json` - DPO 학습용 (prompt-chosen-rejected)
- `qa_pairs.json` - 원본 Q&A 쌍
- `preference_pairs.json` - 원본 선호도 쌍

## 4단계: 모델 파인튜닝

### 필요 환경
- **GPU**: NVIDIA RTX 3090/4090 (24GB VRAM) 이상
- **또는**: Google Colab Pro, RunPod, Lambda Labs 등 클라우드

### 추가 패키지 설치 (GPU 환경에서)
```bash
pip install unsloth
pip install trl transformers datasets peft bitsandbytes
```

### SFT (Supervised Fine-Tuning)
ADHD 지식을 모델에 주입합니다.

```bash
python finetune_model.py \
    --mode sft \
    --data ./output/sft_dataset.json \
    --base-model qwen2-7b \
    --output ./adhd_coach_sft \
    --epochs 3
```

### DPO (Direct Preference Optimization)
ADHD 친화적인 응답 스타일을 학습합니다.

```bash
python finetune_model.py \
    --mode dpo \
    --data ./output/dpo_dataset.json \
    --base-model qwen2-7b \
    --output ./adhd_coach_dpo \
    --epochs 1
```

### 권장 학습 순서
```
1. SFT로 ADHD 지식 학습 (3 에폭)
2. DPO로 응답 스타일 정렬 (1 에폭)
```

## 5단계: 모델 사용

### 로컬 추론
```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="./adhd_coach_dpo",
    load_in_4bit=True
)
FastLanguageModel.for_inference(model)

messages = [
    {"role": "system", "content": "당신은 ADHD 전문 코치입니다."},
    {"role": "user", "content": "할 일이 너무 많아서 뭐부터 해야 할지 모르겠어요"}
]

inputs = tokenizer.apply_chat_template(
    messages,
    tokenize=True,
    add_generation_prompt=True,
    return_tensors="pt"
).to("cuda")

outputs = model.generate(inputs, max_new_tokens=256)
print(tokenizer.decode(outputs[0]))
```

### GGUF로 내보내기 (Ollama/llama.cpp 호환)
```bash
python finetune_model.py \
    --mode sft \
    --data ./output/sft_dataset.json \
    --output ./adhd_coach \
    --export-gguf
```

### Ollama에서 사용
```bash
# GGUF 파일을 Ollama에 등록
ollama create adhd-coach -f ./Modelfile

# 사용
ollama run adhd-coach
```

## 추천 베이스 모델

| 모델 | 특징 | VRAM |
|------|------|------|
| `qwen2-7b` | 한국어 성능 좋음 | 8GB (4bit) |
| `llama3-8b` | 균형 잡힌 성능 | 10GB (4bit) |
| `mistral-7b` | 빠른 추론 | 8GB (4bit) |

## 데이터 품질 팁

### 좋은 Q&A 예시
```json
{
  "instruction": "할 일이 너무 많아서 뭐부터 해야 할지 모르겠어요",
  "response": "그 마음 충분히 이해해요. ADHD가 있으면 여러 일이 한꺼번에 머릿속에서 경쟁하니까 특히 어렵죠. 지금 바로 해볼 수 있는 건, 종이 하나 꺼내서 머릿속에 있는 할 일을 다 적어보는 거예요. 적는 것만으로도 머리가 좀 가벼워질 거예요. 그 다음에 딱 하나만 골라서 5분만 해보는 거죠. 뭐가 됐든 상관없어요."
}
```

### 좋은 선호도 쌍 예시
```json
{
  "prompt": "또 미루고 말았어요. 저 왜 이럴까요?",
  "chosen": "자책하지 마세요. ADHD 뇌는 '시작'이 특히 어려워요. 의지력 문제가 아니에요. 그 일의 어떤 부분이 시작을 어렵게 만들었는지 같이 찾아볼까요? 대부분 '너무 크거나', '지루하거나', '어디서 시작해야 할지 모르거나'예요.",
  "rejected": "미루지 않으려면 계획을 잘 세우고 의지력을 발휘해야 해요. 타이머를 설정하고 집중해보세요."
}
```

## 문제 해결

### CUDA out of memory
- `--batch-size 1`로 줄이기
- 더 작은 모델 사용 (7B → 3B)
- gradient_accumulation_steps 늘리기

### 학습이 너무 느림
- Unsloth 사용 확인 (2-5배 빨라짐)
- batch_size 늘리기 (VRAM 허용 시)

### 생성 품질이 낮음
- 데이터 양 늘리기 (최소 1,000개 권장)
- 에폭 수 조절
- 학습률 낮추기

## 비용 추정

### 데이터 생성 (Claude API)
- 청크당 약 $0.01-0.02
- 1,000 청크 → $10-20

### 모델 학습 (클라우드 GPU)
- A100 40GB: 시간당 $1-2
- RTX 4090: 시간당 $0.5-1
- 7B 모델 SFT: 약 2-4시간

## 참고 자료

- [Unsloth GitHub](https://github.com/unslothai/unsloth)
- [TRL 문서](https://huggingface.co/docs/trl)
- [DPO 논문](https://arxiv.org/abs/2305.18290)
