"""
ADHD 코칭 AI 학습 데이터 파이프라인 실행기
전체 과정을 단계별로 안내합니다.
"""

import os
import sys
from pathlib import Path


def print_banner():
    print("""
╔═══════════════════════════════════════════════════════════╗
║          ADHD 코칭 AI 학습 데이터 파이프라인              ║
╚═══════════════════════════════════════════════════════════╝
    """)


def check_requirements():
    """필수 패키지 확인"""
    print("📦 패키지 확인 중...")

    missing = []

    try:
        import fitz
        print("  ✓ PyMuPDF (PDF 처리)")
    except ImportError:
        missing.append("PyMuPDF")
        print("  ✗ PyMuPDF 필요: pip install PyMuPDF")

    try:
        import anthropic
        print("  ✓ anthropic (API)")
    except ImportError:
        print("  ⚠ anthropic 없음 (선택사항): pip install anthropic")

    try:
        import openai
        print("  ✓ openai (API)")
    except ImportError:
        print("  ⚠ openai 없음 (선택사항): pip install openai")

    return len(missing) == 0


def step1_extract(input_dir: str, output_dir: str):
    """1단계: 텍스트 추출"""
    print("\n" + "="*50)
    print("📄 1단계: PDF/텍스트에서 내용 추출")
    print("="*50)

    from extract_data import ADHDDataExtractor

    extractor = ADHDDataExtractor(input_dir, output_dir)
    results = extractor.process_all_files()

    return results["total_chunks"] > 0


def step2_generate(chunks_file: str, output_dir: str, provider: str, max_chunks: int = None):
    """2단계: 학습 데이터 생성"""
    print("\n" + "="*50)
    print("🤖 2단계: AI로 학습 데이터 생성")
    print("="*50)

    from generate_training_data import TrainingDataGenerator

    generator = TrainingDataGenerator(api_provider=provider)
    generator.process_chunks(
        chunks_file=chunks_file,
        output_dir=output_dir,
        data_type="both",
        max_chunks=max_chunks,
        delay=1.0
    )

    return True


def interactive_mode():
    """대화형 모드"""
    print_banner()

    if not check_requirements():
        print("\n⚠️ 필수 패키지를 먼저 설치하세요:")
        print("   pip install -r requirements.txt")
        return

    # 1. 입력 폴더 확인
    print("\n" + "-"*50)
    input_dir = input("📁 ADHD 자료가 있는 폴더 경로를 입력하세요: ").strip()

    if not input_dir:
        input_dir = "./adhd_data"
        print(f"   기본값 사용: {input_dir}")

    input_path = Path(input_dir)
    if not input_path.exists():
        print(f"\n⚠️ 폴더를 찾을 수 없습니다: {input_dir}")
        print("   폴더를 생성하고 PDF/TXT 파일을 넣어주세요.")
        input_path.mkdir(parents=True, exist_ok=True)
        return

    # 파일 확인
    pdfs = list(input_path.glob("**/*.pdf"))
    txts = list(input_path.glob("**/*.txt"))
    print(f"\n   발견된 파일: PDF {len(pdfs)}개, TXT {len(txts)}개")

    if len(pdfs) + len(txts) == 0:
        print("   ⚠️ 처리할 파일이 없습니다.")
        return

    # 2. 출력 폴더
    output_dir = input("\n📁 출력 폴더 경로 (엔터: ./output): ").strip() or "./output"

    # 3. 텍스트 추출
    proceed = input("\n🚀 텍스트 추출을 시작할까요? (y/n): ").strip().lower()
    if proceed != 'y':
        print("취소됨")
        return

    chunks_file = Path(output_dir) / "extracted_chunks.json"
    step1_extract(input_dir, output_dir)

    # 4. 학습 데이터 생성 여부
    print("\n" + "-"*50)
    print("다음 단계: AI로 학습 데이터 생성")
    print("   - Claude 또는 GPT API 키가 필요합니다")
    print("   - API 비용이 발생합니다 (청크당 약 $0.01-0.02)")

    proceed = input("\n🤖 학습 데이터를 생성할까요? (y/n): ").strip().lower()
    if proceed != 'y':
        print("\n📝 나중에 수동으로 실행하려면:")
        print(f"   python generate_training_data.py --chunks {chunks_file} --output {output_dir}")
        return

    # API 선택
    provider = input("   API 선택 (1: Claude, 2: GPT): ").strip()
    provider = "anthropic" if provider == "1" else "openai"

    # API 키 확인
    key_name = "ANTHROPIC_API_KEY" if provider == "anthropic" else "OPENAI_API_KEY"
    if not os.environ.get(key_name):
        api_key = input(f"   {key_name}를 입력하세요: ").strip()
        os.environ[key_name] = api_key

    # 테스트 모드
    test_mode = input("   테스트 모드 (5개 청크만)? (y/n): ").strip().lower() == 'y'
    max_chunks = 5 if test_mode else None

    step2_generate(str(chunks_file), output_dir, provider, max_chunks)

    # 완료
    print("\n" + "="*50)
    print("✅ 완료!")
    print("="*50)
    print(f"\n생성된 파일:")
    print(f"  - {output_dir}/sft_dataset.json (SFT 학습용)")
    print(f"  - {output_dir}/dpo_dataset.json (DPO 학습용)")
    print(f"\n다음 단계: GPU 환경에서 모델 파인튜닝")
    print(f"  python finetune_model.py --mode sft --data {output_dir}/sft_dataset.json")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # CLI 모드
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument('--input', '-i', required=True)
        parser.add_argument('--output', '-o', default='./output')
        parser.add_argument('--generate', '-g', action='store_true')
        parser.add_argument('--provider', '-p', default='anthropic')
        parser.add_argument('--max-chunks', '-m', type=int, default=None)
        args = parser.parse_args()

        step1_extract(args.input, args.output)

        if args.generate:
            chunks_file = Path(args.output) / "extracted_chunks.json"
            step2_generate(str(chunks_file), args.output, args.provider, args.max_chunks)
    else:
        # 대화형 모드
        interactive_mode()
