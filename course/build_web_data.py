"""Embed existing course content so the HTML works directly from disk, offline."""
from pathlib import Path
import json,re
from html import escape
try:
    from pypdf import PdfReader  # only needed when the book PDFs are present
except ImportError:
    PdfReader = None

BASE=Path(__file__).resolve().parent

def inline(text):
    # Protect explicit mathematics and code from Markdown emphasis parsing.
    tokens=[]
    def protect(match):
        content=match.group(0)
        if content.startswith('`'):
            html='<code>'+escape(content[1:-1])+'</code>'
        else:
            html='<span class="inline-math" data-inline="true" data-equation="'+escape(content[2:-2],quote=True)+'"></span>'
        tokens.append(html)
        return f'@@COURSE_TOKEN_{len(tokens)-1}@@'
    text=re.sub(r'`[^`]+`|\\\([\s\S]*?\\\)',protect,text)
    result=escape(text)
    result=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',result)
    result=re.sub(r'`([^`]+)`',r'<code>\1</code>',result)
    result=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',r'<a href="\2" target="_blank" rel="noopener">\1 ↗</a>',result)
    for i,html in enumerate(tokens):
        result=result.replace(f'@@COURSE_TOKEN_{i}@@',html)
    return result

def equation(block):
    return '<div class="body-equation" data-equation="'+escape(block,quote=True)+'"></div>'

def markdown(text):
    result=[]; paragraph=[]; list_type=None; in_math=False; math=[]; code=None
    def flush():
        if paragraph:
            result.append('<p>'+inline(' '.join(paragraph))+'</p>');paragraph.clear()
    def close_list():
        nonlocal list_type
        if list_type: result.append('</'+list_type+'>');list_type=None
    for line in text.splitlines():
        if line.startswith('```'):
            flush();close_list()
            if code is None: code=[]
            else: result.append('<pre class="formula-block"><code>'+escape('\n'.join(code))+'</code></pre>');code=None
            continue
        if code is not None: code.append(line);continue
        if line.strip()=='\\[':
            flush();in_math=True;math=[];continue
        if line.strip()=='\\]':
            result.append(equation('\n'.join(math)));in_math=False;continue
        if in_math: math.append(line);continue
        if not line.strip():
            flush();close_list()
            continue
        heading=re.match(r'^(#{1,3}) (.*)',line)
        if heading:
            flush();close_list();level=len(heading[1]);result.append(f'<h{level}>'+inline(heading[2])+f'</h{level}>');continue
        match=re.match(r'(?:\d+\. |[-*] )(.*)',line)
        if match:
            flush()
            wanted='ol' if re.match(r'\d',line) else 'ul'
            if list_type!=wanted: close_list();result.append('<'+wanted+'>');list_type=wanted
            result.append('<li>'+inline(match[1])+'</li>');continue
        close_list()
        paragraph.append(line)
    flush()
    close_list()
    return '\n'.join(result)

def outline_entries(reader):
    """Yield (depth, title, zero-based page) for every bookmark, tolerating malformed actions."""
    entries=[]
    def walk(node,depth):
        while node is not None:
            node=node.get_object()
            page=None
            try:
                dest=node.get('/Dest')
                if dest is None and '/A' in node: dest=node['/A'].get_object().get('/D')
                dest=dest.get_object() if hasattr(dest,'get_object') else dest
                if isinstance(dest,str) or not hasattr(dest,'__getitem__'):
                    named=reader.named_destinations.get(str(dest))
                    page=reader.get_destination_page_number(named) if named else None
                else:
                    target=dest[0].get_object() if hasattr(dest[0],'get_object') else dest[0]
                    page=target if isinstance(target,int) else reader.get_page_number(target)
            except Exception:
                page=None
            entries.append((depth,str(node.get('/Title','')).strip(),page))
            if '/First' in node: walk(node['/First'],depth+1)
            node=node['/Next'] if '/Next' in node else None
    root=reader.trailer['/Root'].get('/Outlines')
    if root is not None and '/First' in root.get_object(): walk(root.get_object()['/First'],0)
    return entries

def section_index(key,reader):
    """Map a book's section labels to one-based PDF pages so reading links open at the cited section."""
    index={}
    def put(label,page,title):
        if page is not None and label not in index: index[label]={'page':page+1,'title':title}
    entries=outline_entries(reader)
    if key=='CS205A':
        # The notes number chapters from 0 and their bookmarks omit the numbers; count them in order.
        chapter=-1;section=sub=0
        for depth,title,page in entries:
            if depth==1: chapter+=1;section=0;put(str(chapter),page,title)
            elif depth==2 and chapter>=0: section+=1;sub=0;put(f'{chapter}.{section}',page,title)
            elif depth==3 and chapter>=0: sub+=1;put(f'{chapter}.{section}.{sub}',page,title)
    elif key=='GUO':
        part=0;current=None
        for depth,title,page in entries:
            if re.match(r'^Part \d+',title): part=int(re.match(r'^Part (\d+)',title)[1]);continue
            chapter=re.match(r'^(?:Ch)?(\d+) ',title)
            if depth==0 and chapter and part: current=f'P{part}.C{chapter[1]}';put(current,page,title);continue
            section=re.match(r'^\W*(\d+) ',title)
            if depth==1 and section and current: put(f'{current}.S{section[1]}',page,re.sub(r'^\W*\d+ ','',title))
    else:
        for depth,title,page in entries:
            match=re.match(r'^(?:Chapter |Appendix )?([A-Z]|\d+)((?:\.\d+)*)\s+(.*)$',title)
            if match: put(match[1]+match[2],page,match[3])
        if key=='MML':
            # MML bookmarks stop at sections; find numbered subsection headings within each section's pages.
            sections=sorted((v['page'],k) for k,v in index.items() if re.fullmatch(r'\d+\.\d+',k))
            for i,(start,label) in enumerate(sections):
                stop=sections[i+1][0] if i+1<len(sections) else len(reader.pages)
                for page in range(start-1,stop):
                    for line in (reader.pages[page].extract_text() or '').splitlines():
                        heading=re.match(rf'^({re.escape(label)}\.\d+) ([A-Z][^.]{{3,80}})$',line.strip())
                        if heading: put(heading[1],page,heading[2].strip())
    return index

# Lessons 01-04 are parsed from Markdown; their readings live here rather than in later-lessons.json.
FOUNDATION_READING={
    1:'CS205A 0.3.2; MML Chapter 1 for motivation.',
    2:'CS205A 0.1 and 0.3; preview MML 2.7, where a linear mapping is a function between vector spaces.',
    3:'MML 8.2.2 for a loss used in training; CS205A 1.2 for how numerical error is measured.',
    4:'CV 5.1.3 and 5.3.4 as a preview of logistic regression and cross-entropy; MML 6.1.2 for probabilities and random variables.'}
data=json.loads((BASE/'course-map.json').read_text(encoding='utf-8'))
data['lessons']=[]
continuation={lesson['id']:lesson for lesson in json.loads((BASE/'later-lessons.json').read_text(encoding='utf-8'))} if (BASE/'later-lessons.json').exists() else {}
# Lessons 49+ keep their metadata beside their other files: extensions/lesson-NN.json.
for extension in sorted((BASE/'extensions').glob('lesson-*.json')):
    lesson=json.loads(extension.read_text(encoding='utf-8'));continuation[lesson['id']]=lesson
for file in sorted((BASE/'lessons').glob('*.md')):
    n=int(file.name.split('-')[0])
    raw=file.read_text(encoding='utf-8')
    if n in continuation:
        lesson=dict(continuation[n]);lesson['html']=markdown(raw);data['lessons'].append(lesson);continue
    elif n>4:
        print('Skipping',file.name,'until its metadata (extensions/lesson-NN.json) exists.');continue
    elif n==1:
        exercise_block=raw.split('## 6. Practice before looking at solutions',1)[1].split('**Exit explanation:**',1)[0]
        exercises=re.findall(r'^\d+\. (.*)$',exercise_block,re.M)
    else:
        exercise_block=next(line for line in raw.splitlines() if line.startswith('**Practice:**'))
        exercise_block=exercise_block.removeprefix('**Practice:**').strip()
        exercises=re.findall(r'(?:^|\s)\([1-9]\)\s+(.*?)(?=\s+\([1-9]\)\s+|$)',exercise_block)
    data['lessons'].append({'id':n,'module':1,'title':raw.splitlines()[0].split(' - ',1)[1],'goal':re.search(r'^\*\*Goal:\*\* (.+)$',raw,re.M)[1],'html':markdown(raw),'file':'lessons/'+file.name,'exercises':exercises,'minutes':90,'lab':['pixels','functions','loss','confidence'][n-1],'reading':FOUNDATION_READING[n]})
data['assessment']=[]
raw=(BASE/'starting-assessment.md').read_text(encoding='utf-8')
for line in raw.splitlines():
    match=re.match(r'\d+\. (.*)',line)
    if match: data['assessment'].append(match[1])
data['assessmentAnswers']=[
    '3x=15, so x=5.', 'f(3)=7; the slope is 2.', 'ln(e^2)=2. The real logarithm needs x>0.',
    'The mean is (20+60+100+140)/4=80.', '0.5I+10=[[20,40],[60,80]].',
    'u dot v=1*3+2*4=11.', 'Ax has shape 3x1. xA is invalid because the adjacent dimensions 1 and 3 do not match.',
    'Adding gives 2x=6, so x=3 and y=2.', 'The derivatives are 2x and 4(2x+1)=8x+4.',
    'The partial derivatives are 2x+3y and 3x.',
    'P(B)=0.8*0.2+0.1*0.8=0.24. P(A given B)=0.16/0.24=2/3.',
    'np.array([[20,60],[100,140]],dtype=float).mean() gives 80. * is elementwise multiplication; @ is matrix multiplication for 2D arrays.'
]
data['plan']=[[],[]]
week=0
for line in (BASE/'first-two-weeks.md').read_text(encoding='utf-8').splitlines():
    if line=='## Week 2': week=1
    if re.match(r'\| [1-6] \|',line):
        parts=[s.strip() for s in line.split('|')[1:-1]]
        data['plan'][week].append({'session':int(parts[0]),'minutes':int(parts[1].split()[0]),'task':parts[2],'evidence':parts[3]})
for week in range(3,2*len(data['modules'])+1):
    module=data['modules'][(week-1)//2]
    ids=list(range((module['n']-1)*4+1,(module['n']-1)*4+5))
    pair=ids[:2] if week%2==1 else ids[2:]
    titles=[next((l['title'] for l in data['lessons'] if l['id']==n),next((x.split(' ',1)[1] for x in module['lessons'] if x.startswith(f'{n:02d} ')),f'Lesson {n}')) for n in pair]
    tasks=[(90,f'Lesson {pair[0]:02d}: {titles[0]}. Read, calculate the example, then attempt practice.','Four attempted answers and one explanation.'),
           (90,f'Lesson {pair[1]:02d}: {titles[1]}. Work the derivation before opening solutions.','Four attempted answers with your reasoning.'),
           (90,f'Module {module["n"]:02d} notebook or experiment. Predict an outcome before running.','A controlled calculation and an annotated result.'),
           (60,'Read the two lessons’ selected PDF sections. Review one difficult definition.','One book connection and one question.'),
           (90,'Solve fresh variants of the exercises; revisit earlier errors.','A corrected solution and an unseen-example attempt.'),
           (60,'Review the checkpoints and write a short explanation without notes.','Your error log and a readiness decision.')]
    data['plan'].append([dict(session=i+1,minutes=t[0],task=t[1],evidence=t[2]) for i,t in enumerate(tasks)])
data['notebooks']=[
    dict(title='Foundations · Modules 1',href='notebooks/week01-02-foundations.ipynb',modules=[1]),
    dict(title='Linear algebra, fitting & PCA · Modules 2–4',href='notebooks/linear-algebra-and-pca.ipynb',modules=[2,3,4]),
    dict(title='Calculus, noise & uncertainty · Modules 5–6',href='notebooks/calculus-and-probability.ipynb',modules=[5,6]),
    dict(title='Losses, optimization & backprop · Modules 7–8, 10',href='notebooks/learning-and-backprop.ipynb',modules=[7,8,10]),
    dict(title='Filters, CNNs & mask metrics · Modules 9, 11–12',href='notebooks/vision-and-metrics.ipynb',modules=[9,11,12]),
    dict(title='Geometry & architectures · Modules 13–14',href='notebooks/geometry-and-architectures.ipynb',modules=[13,14]),
    dict(title='Features, two-view geometry & generative models · Modules 15–17',href='notebooks/features-geometry-and-generative.ipynb',modules=[15,16,17])]
data['companions']={40:[dict(title='Official PyTorch autograd tutorial',url='https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html')],44:[dict(title='Official COCO evaluator and metric conventions',url='https://github.com/cocodataset/cocoapi/blob/master/PythonAPI/pycocotools/cocoeval.py')]}
assert len({l['id'] for l in data['lessons']})==len(data['lessons'])
data['sections']={}
# The book PDFs are not redistributed; without a local copy, keep the page count and section index from the last build.
previous=json.loads((BASE/'course-data.js').read_text(encoding='utf-8').removeprefix('window.CV_COURSE = ').rstrip().rstrip(';')) if (BASE/'course-data.js').exists() else {}
for key,source in data['sources'].items():
    pdf=BASE/'resources'/source.pop('file')
    source['href']='resources/'+pdf.name
    if pdf.exists():
        reader=PdfReader(pdf)
        source['pages']=len(reader.pages)
        data['sections'][key]=section_index(key,reader)
    else:
        print('No local copy of',pdf.name,'- reusing its page index from the previous build.')
        source['pages']=previous.get('sources',{}).get(key,{}).get('pages')
        data['sections'][key]=previous.get('sections',{}).get(key,{})
payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
(BASE/'course-data.js').write_text('window.CV_COURSE = '+payload+';\n',encoding='utf-8')
print('Embedded',len(data['modules']),'modules,',len(data['lessons']),'full lessons,',len(data['assessment']),'assessment questions and',
      sum(len(v) for v in data['sections'].values()),'book sections with page links.')
